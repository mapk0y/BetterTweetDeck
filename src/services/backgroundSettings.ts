import {isRight} from 'fp-ts/lib/Either';
import {PathReporter} from 'io-ts/lib/PathReporter';

import {ExtensionSettings} from '../helpers/webExtensionHelpers';
import {RBetterTweetDeckSettings} from '../types/BTDSettings';

const defaultSettings = RBetterTweetDeckSettings.decode({});

async function getValidatedSettings() {
  const currentSettings = await ExtensionSettings.get();
  const settingsWithDefault = RBetterTweetDeckSettings.decode(currentSettings);

  if (!isRight(settingsWithDefault)) {
    console.error('Had to use default settings');
    console.log(PathReporter.report(settingsWithDefault));
    return defaultSettings;
  }

  return settingsWithDefault.right;
}

export async function setupSettingsInBackground() {
  const settings = await getValidatedSettings();
  console.log({settings});

  await ExtensionSettings.set(settings);
}