"use client";
import { Search } from "lucide-react";
import { useState } from "react";
import { SearchMusicModal } from "./SearchMusicModal";
import { Button } from "../ui/button";

export const SearchMusic = () => {
  const [modalOpened, setModalOpened] = useState(false);

  return (
    <>
      <Button
        className="w-full flex justify-start gap-3 py-2 text-white font-medium bg-white/10 hover:bg-white/15 rounded-md text-xs transition-colors duration-200"
        variant="ghost"
        onClick={() => setModalOpened(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search Music</span>
      </Button>
      <SearchMusicModal opened={modalOpened} setOpened={setModalOpened} />
    </>
  );
};