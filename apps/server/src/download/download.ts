
import { Track } from "@auri/shared";

/**
 * Implementations of this interface should provide search functionality from a provider.
 */
export interface SearchService {
    /**
     * Search a list of tracks from the provider.
     * @param query Search query
     */
    search(query: string): Promise<Track[]>;
}

/**
 * Implementations of this interface shold provide download functionality from a provider
 */
export interface MusicDownloader {
    /**
     * Downloads a track from the provider, returning the path of the downloaded file.
     * @param trackId The ID of the track to be downloaded
     */
    download(trackId: string): Promise<string>;
}

/**
 * Dab Music service that implements search and download functionality.
 */
class DabMusicService implements SearchService, MusicDownloader {

    async search(query: string): Promise<Track[]> {
        const urlEncoded = encodeURIComponent(query);

        const { tracks }: {tracks: Track[]} = await fetch("https://dab.yeet.su/api/search?q=" + urlEncoded + "&offset=0&type=track", {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                "Sec-GPC": "1",
                "Alt-Used": "dab.yeet.su",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Priority": "u=0",
                //"Pragma": "no-cache",
                //"Cache-Control": "no-cache"
            },
            "referrer": "https://dab.yeet.su/",
            "method": "GET",
            "mode": "cors"
        }).then(r => r.json());

        return tracks;
    }


    async download(trackId: string): Promise<string> {
        throw new Error("Method not implemented.");
    }

}

const implementation = new DabMusicService();

export const SEARCH_SERVICE: SearchService = implementation;
export const MUSIC_DOWNLOADER: MusicDownloader = implementation;