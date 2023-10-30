import fetch from 'node-fetch';
export async function m3u8tomp4(m3u8Url) {
    try {
        const response = await fetch(m3u8Url)
        const m3u8Content = await response.text();
        const lines = m3u8Content.split('\n');
        const segmentUrls = lines.filter(line => line.endsWith('.ts')).map(line => new URL(line, m3u8Url).toString());

        let processedSegments = 0;
        const segmentBlobs = [];

        await Promise.all(segmentUrls.map(async url => {
            try {
                const response = await fetch(url)
                if (!response.ok) {
                        console.log(`Error fetching segment ${url}: ${response.statusText}`);
                }
                else{
                    const buffer = response.arrayBuffer();
                    segmentBlobs.push(new Blob([buffer]));
                }
                processedSegments++;
                const progress = (processedSegments / segmentUrls.length) * 100;
                console.log("segment: "+url+" "+progress);
            } catch (err) {
                console.log(err.message);
            }
        }));
        const combinedBlob = new Blob(segmentBlobs, { type: 'application/octet-stream' });
        const mkvblobURl = URL.createObjectURL(combinedBlob);
        console.log("mkv blob is done");
        return mkvblobURl;

    } catch (err) {
        console.error(err.message);
        return null;
    }
}