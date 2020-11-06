#!/usr/bin/env node
const axios = require('axios');
const moment = require('moment')

let previousVoteDifference;

async function main() {
  const state = process.argv.slice(2).join(' ');
  if (!state) {
    throw new Error('Must provide a state name (e.g. georgia)');
  }
  await printDifference(state);
  setInterval(() => printDifference(state), 30000);
}

async function printDifference(state) {
  const response = await axios.get(`https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/race-page/${state.replace(/ /g, '-').toLowerCase()}/president.json`)
    .catch(e => {
      if (e.response.status === 404) {
        throw new Error(`Could not get data for '${state}'; it might not be a correctly formatted state name`)
      }
    });

  const race = response.data.data.races[0];

  const voteDifference = Math.abs(race.candidates[0].votes - race.candidates[1].votes);
  let differenceSuffix = '(=)';
  if (previousVoteDifference && voteDifference !== previousVoteDifference) {
    const diffFromPrevious = Math.abs(voteDifference - previousVoteDifference);
    differenceSuffix = voteDifference > previousVoteDifference ? `(↑${diffFromPrevious})` : `(↓${diffFromPrevious})`
  }
  previousVoteDifference = voteDifference;

  const leader = race.leader_margin_name_display.split(" ")[0];
  console.log(`${moment().format('HH:mm:ss')}: ${leader} ahead by ${voteDifference} votes in ${titleCase(state)} ${differenceSuffix}`)
}

function titleCase(str) {
  return str.replace(/(^|\s)\S/g, function(t) { return t.toUpperCase() });
}

main().catch(console.error);
