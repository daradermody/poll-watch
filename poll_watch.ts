#!/usr/bin/env bun

import moment, { type Moment } from 'moment'
import {fetchData, type RaceInfo} from './fetch_data.ts'

const STATES_TO_WATCH = [
  'DC',  'VT', 'MD', 'MA', 'HI', 'CA', 'WA', 'CT', 'NY', 'RI', 'DE', 'IL', 'NJ', 'OR', 'CO', 'ME', 'NM', 'VA', 'NH', 'MN',
  'MI', 'WI', 'PA', 'NV', 'GA', 'NC', 'AZ',
  'FL', 'IA', 'TX', 'OH', 'AK', 'SC', 'MO', 'KS', 'IN', 'NE', 'MT', 'MS', 'LA', 'UT', 'TN', 'AL', 'SD', 'KY', 'AR', 'ND', 'ID', 'OK', 'WV', 'WY'
]
const STATES_TO_HIGHLIGHT = ['NA', 'AZ', 'NC', 'MI', 'NV', 'WI', 'PA', 'GA']

const STYLE = {
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  UNDERLINE: '\x1b[4m',
  YELLOW_TEXT: '\x1b[33m',
  BLUE_TEXT: '\x1b[36m',
  BLUE_BACKGROUND: '\x1b[44m',
  RED_TEXT: '\x1b[1;91m',
  RED_BACKGROUND: '\x1b[41m'
};

const history: History = {};

async function main() {
  await printRaceStats(STATES_TO_WATCH);
  setInterval(() => printRaceStats(STATES_TO_WATCH), 10_000);
}

async function printRaceStats(statesToPrint: string[]) {
  const races = await fetchData()
  const watchedRaces = races
    .filter(race => statesToPrint.includes(race.statePostal))
    .sort((raceA, raceB) => statesToPrint.indexOf(raceB.statePostal) > statesToPrint.indexOf(raceA.statePostal) ? -1 : 1)
  const now = moment().startOf('minute');

  const columns: Column[] = [
    {
      name: 'State',
      getValue: ({ stateName }) => stateName, width: 22,
      getStyle: ({ statePostal }) => STATES_TO_HIGHLIGHT.includes(statePostal) ? STYLE.YELLOW_TEXT : undefined
    },
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
        return `${leader} +${voteLeadPercentage}%`.padEnd(10) + `${getChangeSuffix(now, statePostal, 'voteLeadPercentage', voteLeadPercentage || 0)}`
      },
      getStyle: race => {
        if (race.leader === 'Harris') {
          return STYLE.BLUE_TEXT
        } else if (race.leader === 'Trump') {
          return STYLE.RED_TEXT
        }
      },
      width: 24
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
    .map(({ getValue, width, getStyle }) => {
      const color = winnerColor || getStyle?.(race) || ''
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
  getStyle?(stateInfo: RaceInfo): string | undefined
  width: number
}

interface History {
  [time: string]: {
    [stateName: string]: RaceInfo
  }
}

main()
  .catch(console.error);
