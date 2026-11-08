
import ping from './ping.js';
import menu from './menu.js';
import ai from './ai.js';
import sticker from './sticker.js';
import download from './download.js';
import tts from './tts.js';
import group from './group.js';

export const commands = new Map([

  ['ping', ping],

  ['menu', menu],

  ['ai', ai],

  ['sticker', sticker],

  ['s', sticker],

  ['download', download],

  ['tts', tts],

  ['kick', group],

  ['add', group],

  ['promote', group],

  ['demote', group],

  ['group', group]

]);
