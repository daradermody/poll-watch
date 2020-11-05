#!/usr/bin/env node

const axios = require('axios');
const moment = require('moment');

const STATES_TO_WATCH = ['Arizona', 'Nevada', 'Wisconsin', 'Michigan', 'Pennsylvania', 'North Carolina', 'Georgia'];

const STYLE = {
  RESET: '\x1b[0m',
  BOLD: '\033[1m',
  UNDERLINE: '\033[4m',
  BLUE_BACKGROUND: '\x1b[44m',
  RED_BACKGROUND: '\x1b[41m'
};

const history = {};

async function main() {
  await printRaceStats(STATES_TO_WATCH);
  setInterval(() => printRaceStats(STATES_TO_WATCH), 30000);
}

async function printRaceStats(statesToPrint) {
  const result = await axios.get('https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/national-map-page/national/president.json');
  const watchedRaces = result.data.data.races
    .filter(race => statesToPrint.includes(race.state_name))
    .sort((a, b) => a.eevp > b.eevp ? -1 : 1);

  const now = moment().startOf('minute').valueOf();

  const columns = [
    { name: 'State', getValue: ({ state_name }) => state_name, width: 16 },
    { name: 'EV', getValue: ({ electoral_votes }) => electoral_votes, width: 5 },
    {
      name: 'Counted',
      getValue: ({ state_name, eevp }) => `${eevp}%${getChangeSuffix(now, state_name, 'eevp', eevp)}`,
      width: 10
    },
    {
      name: 'Leader',
      getValue: ({ state_name, leader_margin_name_display, leader_margin_value }) => {
        return `${leader_margin_name_display}`.padEnd(10) + `${getChangeSuffix(now, state_name, 'leader_margin_value', leader_margin_value)}`
      },
      width: 19
    },
  ];

  console.clear();

  console.log(getHeader(columns));

  history[now] = {};
  for (const race of watchedRaces) {
    race.leader_margin_value = Math.round(race.leader_margin_value * 10) / 10;
    history[now][race.state_name] = race;
    console.log(formatRace(race, columns));
  }

  console.log();
  console.log(`Biden needs ${270 - result.data.data.party_control[1].parties.democrat.count} more`);
  console.log(`Trump needs ${270 - result.data.data.party_control[1].parties.republican.count} more`);
}

function getChangeSuffix(now, stateName, field, currentValue) {
  const key = moment(now).subtract(10, 'minutes').startOf('minute').valueOf();
  const oldRaceStat = history[key] ? history[key][stateName] : undefined;
  if (oldRaceStat) {
    if (currentValue === oldRaceStat[field]) {
      return ` (=)`;
    } else {
      const diff = Math.round((currentValue - oldRaceStat[field]) * 10) / 10;
      return ` (${currentValue > oldRaceStat[field] ? '↑' : '↓'}${Math.abs(diff)})`;
    }
  } else {
    return '';
  }
}

function getHeader(columns) {
  const cells = columns
    .map(({ name, width }) => STYLE.BOLD + STYLE.UNDERLINE + `${name}`.padEnd(width - 2) + STYLE.RESET);
  return '| ' + cells.join(' | ') + ' |';
}

function formatRace(race, columns) {
  const colour = getColour(race) || '';
  const cells = columns
    .map(({ getValue, width }) => colour + ` ${getValue(race)} `.padEnd(width) + STYLE.RESET);
  return '|' + cells.join('|') + '|';
}

function getColour(race) {
  const winner = race.candidates.find(candidate => candidate.winner);
  if (winner) {
    return winner.last_name === 'Biden' ? STYLE.BLUE_BACKGROUND : STYLE.RED_BACKGROUND;
  }
}

main()
  .catch(console.error);
