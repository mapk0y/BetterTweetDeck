/* global TD */
import moduleRaid from 'moduleraid';

import {BTDUtils} from './components/btdDebug';
import {ChirpHandler as ChirpHandlerClass} from './components/chirpHandler';
import {RemoveRedirection} from './components/removeRedirection';
import {setUpThumbnailsModals} from './components/thumbnailModalContainer';
import {ThumbnailModalCoordinator} from './components/thumbnailModalCoordinator';
import {Timestamp} from './components/time';
import {insertThumbnailOnTweet} from './thumbnails/tools';
import {BTDSettings} from './types';
import {getSizeForColumnKey, monitorMediaSizes} from './util/columnsMediaSizeMonitor';
import {BTDMessageTypesEnums, msgToContent, ThumbnailDataMessage} from './util/messaging';

const BTD_SETTINGS: BTDSettings = JSON.parse(document.querySelector('[data-btd-settings]')!.getAttribute('data-btd-settings') || '');
const {TD} = window;

let mR;
try {
  mR = moduleRaid();
} catch (e) {
  //
}

window.$ = mR && mR.findFunction('jQuery') && mR.findFunction('jquery:')[0];

const Utils = new BTDUtils(BTD_SETTINGS, TD);
Utils.attach();

const modalCoordinator = new ThumbnailModalCoordinator();

(async () => {
  /* Starts monitoring new chirps */
  const ChirpHandler = new ChirpHandlerClass(BTD_SETTINGS, TD, Utils);
  /* Monitor and get called on every chirp in the page */
  ChirpHandler.onChirp(async (chirpProps) => {
    if (chirpProps.urls.length > 0) {
      msgToContent<ThumbnailDataMessage>({
        type: BTDMessageTypesEnums.CHIRP_URLS,
        payload: chirpProps.urls
      }).then((urlData) => {
        insertThumbnailOnTweet(chirpProps, urlData, getSizeForColumnKey(chirpProps.columnKey), () => {
          modalCoordinator.setThumbnail(urlData);
        });
      });
    }
  });

  /* init the ColumnsMediaSizeKeeper component */
  monitorMediaSizes();

  /*
  * If the user chose so, we override the timestamp function called by TweetDeck
  */
  if (BTD_SETTINGS.ts !== 'relative') {
    /* Init the Timestamp component */
    const BTDTime = new Timestamp(BTD_SETTINGS, TD);
    TD.util.prettyDate = (d: Date) => BTDTime.prettyDate(d);
  }

  /*
 * If the user chose so, we override the link creation mechanism to remove the t.co redirection
 */
  if (BTD_SETTINGS.no_tco) {
    new RemoveRedirection(BTD_SETTINGS, TD).init();
  }

  $(document).one('dataColumnsLoaded', async () => {
    // setUpThumbnailsModals();
    setUpThumbnailsModals(modalCoordinator);
  });
})();

declare global {
  interface Window {
    TD: any;
    $: any;
  }
}