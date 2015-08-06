/**
 * Initialise the Selenium WebDriver session using Leadfoot.
 */
import Server from 'leadfoot/Server';

const makeLeadfootSession = (args, config) => {
    return new Server(config.hub).createSession(config.capabilities);
};

export default makeLeadfootSession;
