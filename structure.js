export function deStructureSearch(jsonData){
    const newJsonData = jsonData.results.map(({ id, title, image, subOrDub }) => ({ id, title, image, subOrDub }));
    return newJsonData;
}
export function deStructureEpisode(jsonData){
    const newJsonData = jsonData.episodes.map(({ id, number })=>({ id, number }));
    return newJsonData;
}
export function deStructureQuality(jsonData){
    const newJsonData = jsonData.sources
        .filter(({quality}) => /^\d/.test(quality))
        .map(({url,quality})=>({url,quality}));
    return newJsonData;
}

