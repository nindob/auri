"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Track } from "@auri/shared"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { searchTracks } from "@/lib/api"
import { Download, Search } from "lucide-react"

type SearchMusicModalProps = {
  opened: boolean,
  setOpened: (opened: boolean) => void,
}

export const SearchMusicModal = ({opened, setOpened}: SearchMusicModalProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResult] = useState<Track[] | null>(null);

    const handleSearch = () => {
      searchTracks(searchQuery)
      .then(tracks => setSearchResult(tracks));
    }

    return <Dialog open={opened} defaultOpen={false} onOpenChange={(o) => {
      if (!o) {
        setSearchQuery("");
        setSearchResult(null);
      }
      setOpened(o);
      }}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Search tracks</DialogTitle>
        <DialogDescription>
          Search for your tracks here, download and close when you are done.
        </DialogDescription>
      </DialogHeader>
      <div className="gap-4 py-4 flex flex-row space-x-1">
        <Input id="searchQuery" placeholder="451 Murubutu" className="col-span-3" onChange={(e) => {setSearchQuery(e.target.value)}}/>
        <Button disabled={searchQuery.length === 0} onClick={handleSearch}><Search/></Button>
        
      </div>
      {searchResults && <ResultsTable results={searchResults}/>}
      <DialogFooter>
        <Button onClick={() => setOpened(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

type ResultsTableProps = {
  results: Track[],
}

const ResultsTable = ({results}: ResultsTableProps) => {

  return <Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Artist</TableHead>
      <TableHead className="w-[100px]">Action</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {results.map((track) => (
      <TableRow key={track.id}>
        <TableCell >{track.title}</TableCell>
        <TableCell >{track.artist}</TableCell>
        <TableCell className="text-right"><Button><Download/></Button></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
}