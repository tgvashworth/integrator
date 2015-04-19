import parseArgs from 'minimist';

const args = parseArgs(process.argv);

if (!args.suite) {
    throw new Error('No suite supplied. Use --suite');
}

const start = args => suite => suite(args);

System.import(args.suite)
    .then(res => res.default)
    .then(start(args));
