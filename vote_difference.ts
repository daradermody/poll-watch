#!/usr/bin/env bun

import moment from 'moment'
import {fetchData} from './fetch_data'

let previousVoteDifference: number;

async function main() {
  const statePostal = process.argv.slice(2).join(' ');
  if (!statePostal) {
    throw new Error('Must provide a state name (e.g. PA)');
  }
  await printDifference(statePostal);
  setInterval(() => printDifference(statePostal), 30000);
}

async function printDifference(statePostal: string) {
  const races = await fetchData()
  const race = races.find(race => race.statePostal === statePostal)
  if (!race) {
    throw new Error('Must be a valid state code (or DC)');
  }

  if (!race.leader) {
    console.log(`${moment().format('HH:mm:ss')}: Nobody ahead in ${race.stateName}`)
    return
  }

  const voteDifference = race.voteLead || 0;
  let differenceSuffix = '(=)';
  if (previousVoteDifference && voteDifference !== previousVoteDifference) {
    const diffFromPrevious = Math.abs(voteDifference - previousVoteDifference);
    differenceSuffix = voteDifference > previousVoteDifference ? `(↑${diffFromPrevious})` : `(↓${diffFromPrevious})`
  }
  previousVoteDifference = voteDifference;

  console.log(`${moment().format('HH:mm:ss')}: ${race.leader} ahead by ${voteDifference} votes in ${race.stateName} ${differenceSuffix}`)
}

main().catch(console.error);
