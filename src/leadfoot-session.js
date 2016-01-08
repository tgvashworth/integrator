/**
 * Initialise the Selenium WebDriver session using Leadfoot.
 */
import Server from 'leadfoot/Server';

const makeLeadfootSession = config =>
  new Server(config.get('hub'), {
      proxy: config.get('proxy')
  }).createSession(config.get('capabilities'));

export default makeLeadfootSession;
