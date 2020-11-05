# 2020 State Poll Watcher

Track live poll results by state.

![screenshot](./screenshot.png)

To set up, clone/download the repo, then run `yarn` or `npm install`.

To start watching poll results, run:

```bash
node poll_watch.js
```

Results refresh every 30 seconds. Comparison with 10 minutes ago is shown in the brackets. EV stands for electoral votes.

The states being displayed can be changed by editing the `STATES_TO_WATCH` value at the top of the file.

A New York Times API is used for retrieving voting data. When the New York Times calls states, the rows highlight accordingly.