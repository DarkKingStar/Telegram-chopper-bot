import TelegramBot from 'node-telegram-bot-api';
import { searchData, animeEpisodeData, episodeVideoData } from './callback.js'; 
import { m3u8tomp4} from './convertoMp4.js';


const bot = new TelegramBot('6005051883:AAGlolgmIB_n22Y5sT-wCNNNSMG2as_gnKU', {polling: true});


var indexToAnimeIdMap = new Map();
var indexToEpisodeIdMap = new Map();
var indexToVideoQMap = new Map();



bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hii! I am Chopper, i can help you to download anime you want to watch \n to search anime type: \n /search Anime_Name");
  });


  bot.onText(/\/search (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];
    const animeList = await searchData(query);
    const keyboard = {
      inline_keyboard: animeList.map((item,index) => {
          const animeInfo = {
            id: item.id,
            title: item.title,
            image: item.image
          }
          indexToAnimeIdMap.set(index, animeInfo);
          return [{ 
              text: item?.title, 
              callback_data: `Anime_${index}` 
          }];
      })
  };

    bot.sendMessage(chatId, `Searching for: "${query}"`, { reply_markup: JSON.stringify(keyboard) });
});

  bot.on('callback_query', async(callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const callData = callbackQuery.data;
    if(callData.includes("Ep_")){
      const episodeInfo = indexToEpisodeIdMap.get(Number(callData.split("_")[1]));
      if(episodeInfo){
      const {id , number} = episodeInfo;

      const videoList = await episodeVideoData(id);
      const keyboard = {
        inline_keyboard: videoList.map((item,index) => {
            const videoInfo = {
              id: id,
              url: item.url,
              quality: item.quality
            }
            indexToVideoQMap.set(index, videoInfo);
            return [{ 
                text: item?.quality, 
                callback_data: `Quality_${index}` 
            }];
        })
      };
      bot.sendMessage(chatId, `Select Quality for ${id}:`, { reply_markup: JSON.stringify(keyboard) });   
    }   
    }
  });

  bot.on('callback_query', async(callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const callData = callbackQuery.data;
    if(callData.includes("Quality_")){
      const qualityInfo = indexToVideoQMap.get(Number(callData.split("_")[1]));
      if(qualityInfo){  
      const {id, url, quality} = qualityInfo;
      bot.sendMessage(chatId,`Please wait generating Mkv file: ${id}-${quality}`);
      const mkvfileblob = await m3u8tomp4(url);
      try{
        if(mkvfileblob){
          bot.sendMessage(chatId,` blob mkv file is genarated`);
          const fileOptions = {
              filename: `${id}-${quality}.mkv`,
              contentType: 'application/octet-stream'
          };
          const mkvfile = new Buffer.from(mkvfileblob);
          console.log("mkv: "+ mkvfile);
          if(mkvfile){
            console.log("mkv file is ok");
            await bot.sendDocument(chatId, mkvfile, {caption: 'Here is your file'}, fileOptions);
          }
        }else{
          bot.sendMessage(chatId,"Can't generate file right now! Sorry");
        }
      }catch(err){
        console.log(err.message);
      }
      
    }
    }
});


let currentPage = 0;
let episodeList = [];
let currentListMessageId;
let currentPageMessageId;

function getPagination(current, maxPage) {
  var keys = [];
  if (current > 1) keys.push({ text: `1`, callback_data: 'Page_1' });
  if (current > 2) keys.push({ text: `<${current - 1}`, callback_data: `Page_${current - 1}` });
  keys.push({ text: `-${current}-`, callback_data: `Page_${current}` });
  if (current < maxPage - 1) keys.push({ text: `${current + 1}>`, callback_data: `Page_${current + 1}` });
  if (current < maxPage) keys.push({ text: `${maxPage}`, callback_data: `Page_${maxPage}` });


  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [keys]
    })
  };
}



bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const callData = callbackQuery.data;

  if (callData.includes("Anime_")) {
    const animeInfo = indexToAnimeIdMap.get(Number(callData.split("_")[1]));

    if (animeInfo) {
      const { id, title, image } = animeInfo;
      episodeList = await animeEpisodeData(id);

      const startIndex = currentPage  * 20;
      const endIndex = (currentPage + 1) * 20;
      const currentEpisodes = episodeList.slice(startIndex, endIndex);

      const keyboard = {
        inline_keyboard: currentEpisodes.map((item, index) => {
          const EpisodeInfo = {
            id: item.id,
            number: item.number
          }
          indexToEpisodeIdMap.set(index, EpisodeInfo);
          return [{
            text: item?.id,
            callback_data: `Ep_${index}`
          }];
        })
      };

      bot.sendPhoto(chatId, image, { caption: `${title}` });
      const sentMessage = await bot.sendMessage(chatId, `Getting Episodes :`, { reply_markup: JSON.stringify(keyboard) });
      currentListMessageId = sentMessage.message_id;
      const pageMessage = await bot.sendMessage(chatId, 'Page: 1', getPagination(1, Math.ceil(episodeList.length / 20)));
      currentPageMessageId = pageMessage.message_id;
    }
  }

  if (callData.includes("Page_")) {
    const page = Number(callData.split("_")[1]);
    currentPage = page;

    const startIndex = (currentPage - 1) * 20;
    const endIndex = currentPage * 20;
    const currentEpisodes = episodeList.slice(startIndex, endIndex);

    const keyboard = {
      inline_keyboard: currentEpisodes.map((item, index) => {
        const EpisodeInfo = {
          id: item.id,
          number: item.number
        }
        indexToEpisodeIdMap.set(index, EpisodeInfo);
        return [{
          text: item?.id,
          callback_data: `Ep_${index}`
        }];
      })
    };

    bot.deleteMessage(chatId, currentListMessageId);
    bot.deleteMessage(chatId, currentPageMessageId);

    const sentMessage = await bot.sendMessage(chatId, `Getting Episodes :`, { reply_markup: JSON.stringify(keyboard) });
    currentListMessageId = sentMessage.message_id;


    const pageMessage = await bot.sendMessage(chatId, `Page: ${page}`, getPagination(page, Math.ceil(episodeList.length / 20)));
    currentPageMessageId = pageMessage.message_id;
  }
});
