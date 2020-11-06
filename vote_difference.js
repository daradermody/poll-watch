const axios = require("axios");

let previousVoteDifference;

async function main() {
  const response = await axios
    .get("https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/race-page/georgia/president.json");
  const race = response.data.data.races[0];
  const voteDifference = Math.abs(race.candidates[0].votes - race.candidates[1].votes);
  let differenceSuffix = '(=)';
  if (previousVoteDifference && voteDifference !== previousVoteDifference) {
    const diffFromPrevious = Math.abs(voteDifference - previousVoteDifference);
    differenceSuffix = voteDifference > previousVoteDifference ? `(↑${diffFromPrevious})` : `(↓${diffFromPrevious})`
  }
  console.log(`${race.leader_margin_name_display.split(" ")[0]} ahead by ${race.candidates[0].votes - race.candidates[1].votes} votes in Georgia ${differenceSuffix}`)
}

main().catch(console.error);
setInterval(() => main().catch(console.error), 30000);
