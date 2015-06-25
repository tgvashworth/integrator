import chalk from 'chalk';

const runnerUtils = {
    gameOver: (...msgs) => {
        runnerUtils.error(...msgs);
        process.exit(1);
    },

    error: (msg, ...msgs) => {
        console.error(chalk.red(msg), ...msgs);
    },

    warning: (msg, ...msgs) => {
        console.error(chalk.yellow(msg), ...msgs);
    },

    info: (...msgs) => {
        console.log(...msgs);
    },

    success: (msg, ...msgs) => {
        console.log(chalk.green(msg), ...msgs);
    },

    // Errors
    TestsFailedError: function (message) {
        this.message = message;
    }
};

export default runnerUtils;
