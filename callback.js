import { ANIME } from '@consumet/extensions';
import { deStructureSearch, deStructureEpisode, deStructureQuality } from './structure.js';

const gogoanime = new ANIME.Gogoanime();

export async function searchData(query) {
    try {
        const results = await gogoanime.search(query);
        const data = await deStructureSearch(results);
        return data;
    } catch (error) {
        return { error: error.message };
    }
}

export async function animeEpisodeData(id){
    try{
        const results = await gogoanime.fetchAnimeInfo(id);
        const data = await deStructureEpisode(results);
        return data;
    }catch(error){
        return { error: error.message};
    }
}

export async function episodeVideoData(id){
    try{
        const results = await gogoanime.fetchEpisodeSources(id);
        const data = await deStructureQuality(results);
        return data;
    }catch(error){
        return{ error : error.message}
    }
}

