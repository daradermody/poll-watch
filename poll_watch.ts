#!/usr/bin/env bun

import moment, { type Moment } from 'moment'
import {fetchData, type RaceInfo} from './fetch_data.ts'

// const STATES_TO_WATCH = ['AZ', 'NV', 'WI', 'MI', 'PA', 'NC', 'GA'];
const STATES_TO_WATCH = [
  'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT',
  'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'
]

const STYLE = {
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  UNDERLINE: '\x1b[4m',
  BLUE_TEXT: '\x1b[36m',
  BLUE_BACKGROUND: '\x1b[44m',
  RED_TEXT: '\x1b[1;91m',
  RED_BACKGROUND: '\x1b[41m'
};

const history: History = {};

async function main() {
  await printRaceStats(STATES_TO_WATCH);
  setInterval(() => printRaceStats(STATES_TO_WATCH), 30000);
}

async function printRaceStats(statesToPrint: string[]) {
  const races = await fetchData()
  const watchedRaces = races.filter(race => statesToPrint.includes(race.statePostal))
  const now = moment().startOf('minute');

  const columns: Column[] = [
    { name: 'State', getValue: ({ stateName }) => stateName, width: 22 },
    { name: 'EV', getValue: ({ electTotal }) => electTotal, width: 5 },
    {
      name: 'Counted',
      getValue: ({ statePostal, eevp }) => `${eevp}%${getChangeSuffix(now, statePostal, 'eevp', eevp)}`,
      width: 16
    },
    {
      name: 'Leader',
      getValue: ({ statePostal, leader, voteLeadPercentage }) => {
        if (!leader) {
          return 'N/A'
        }
        return `${leader} +${voteLeadPercentage}`.padEnd(10) + `${getChangeSuffix(now, statePostal, 'voteLeadPercentage', voteLeadPercentage || 0)}`
      },
      getColor: race => {
        if (race.leader === 'Harris') {
          return STYLE.BLUE_TEXT
        } else if (race.leader === 'Trump') {
          return STYLE.RED_TEXT
        }
      },
      width: 23
    },
  ];

  console.clear();

  console.log(getHeader(columns));

  const nowKey = now.toISOString()
  history[nowKey] = {};
  for (const race of watchedRaces) {
    history[nowKey][race.statePostal] = race;
    console.log(formatRace(race, columns));
  }

  console.log();
  console.log(`Harris needs ${270 - countElectoralVotes(races, 'Harris')} more`);
  console.log(`Trump needs ${270 - countElectoralVotes(races, 'Trump')} more`);
}

function getChangeSuffix(now: Moment, statePostal: string, field: 'eevp' | 'voteLeadPercentage', currentValue: number) {
  const key = moment(now).subtract(10, 'minutes').startOf('minute').toISOString()
  const oldRaceStat = history[key]?.[statePostal];
  if (!oldRaceStat) {
    return ''
  }

  if (currentValue === oldRaceStat[field]) {
    return ` (=)`;
  } else {
    const prevValue = oldRaceStat[field] || 0
    const diff = Math.round((currentValue - prevValue) * 10) / 10;
    return ` (${currentValue > prevValue ? '↑' : '↓'}${Math.abs(diff)})`;
  }
}

function getHeader(columns: Column[]) {
  const cells = columns
    .map(({ name, width }) => STYLE.BOLD + STYLE.UNDERLINE + `${name}`.padEnd(width - 2) + STYLE.RESET);
  return '| ' + cells.join(' | ') + ' |';
}

function formatRace(race: RaceInfo, columns: Column[]) {
  const winnerColor = race.raceCallStatus === 'Called' ? getColor(race.leader) : undefined;
  const cells = columns
    .map(({ getValue, width, getColor }) => {
      const color = winnerColor || getColor?.(race) || ''
      return color + ` ${getValue(race)} `.padEnd(width) + STYLE.RESET
    });
  return '|' + cells.join('|') + '|';
}

function getColor(leader: RaceInfo['leader']) {
  return leader === 'Harris' ? STYLE.BLUE_BACKGROUND : STYLE.RED_BACKGROUND
}

function countElectoralVotes(races: RaceInfo[], candidate: RaceInfo['leader']) {
  return races
    .filter(race => race.raceCallStatus === 'Called' && race.leader === candidate)
    .map(races => races.electTotal)
    .reduce((acc, cur) => acc + cur, 0);
}

interface Column {
  name: string
  getValue(stateInfo: RaceInfo): string | number
  getColor?(stateInfo: RaceInfo): string | undefined
  width: number
}

interface History {
  [time: string]: {
    [stateName: string]: RaceInfo
  }
}

main()
  .catch(console.error);
