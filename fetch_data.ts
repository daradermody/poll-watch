import axios from 'axios'

export interface RaceInfo {
  statePostal: StateInfo['statePostal']
  stateName: StateInfo['stateName']
  electTotal: StateInfo['electTotal']
  leader?: 'Harris' | 'Trump'
  voteLeadPercentage?: number
  voteLead?: number
  eevp: StateInfo['eevp']
  precinctsReportingPct: StateInfo['precinctsReportingPct']
  raceCallStatus: StateInfo['raceCallStatus']
}

export async function fetchData(): Promise<RaceInfo[]> {
  const result = await axios.get<GuardianData>('https://interactive.guim.co.uk/2024/11/us-election-data/production/v1/latest/details/results_P.json')
  const races = result.data
    .filter(race => race.statePostal !== 'US')
    // .sort((a, b) => a.eevp > b.eevp ? -1 : 1)

  return races.map(race => {
    const harris = race.candidates.find(candidate => candidate.last === 'Harris')!
    const trump = race.candidates.find(candidate => candidate.last === 'Trump')!
    const processedRace: RaceInfo = {
      statePostal: race.statePostal,
      stateName: race.stateName,
      electTotal: race.electTotal,
      eevp: race.eevp,
      precinctsReportingPct: race.precinctsReportingPct,
      raceCallStatus: race.raceCallStatus,
    }
    const winner = race.candidates.find(candidates => candidates.winner)
    if (race.totalvotes || winner) {
      if (winner) {
        processedRace.leader = winner.last
      } else {
        processedRace.leader = harris.voteCount > trump.voteCount ? 'Harris' : 'Trump'
      }
      const voteLead = Math.abs(harris.voteCount - trump.voteCount)
      const voteLeadPercentage = voteLead / race.totalvotes * 100 || 0
      processedRace.voteLeadPercentage = Math.round(voteLeadPercentage * 100) / 100
      processedRace.voteLead = Math.round(voteLead * 100) / 100
    }
    return processedRace
  })
}

type GuardianData = StateInfo[]

interface StateInfo {
  statePostal: string
  stateName: string
  electTotal: number
  totalvotes: number
  eevp: number
  precinctsReportingPct: number
  raceCallStatus: 'Too Early to Call' | 'Called'
  candidates: Candidate[]
}

interface Candidate {
  last: 'Harris' | 'Trump',
  voteCount: number
  voteShare: number
  winner?: 'X'
}
