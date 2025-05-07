import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  
  interface TrackSelectorProps {
    selectedTrack: string;
    onTrackChange: (track: string) => void;
  }
  
  export const TrackSelector: React.FC<TrackSelectorProps> = ({
    selectedTrack,
    onTrackChange,
  }) => {
    return (
      <div className="mt-4 mb-4">
        <Select value={selectedTrack} onValueChange={onTrackChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4EVA - Ordley">4EVA</SelectItem>
            <SelectItem value="Love for You - loveli lori & ovg!">Love for You</SelectItem>
            <SelectItem value="New Patek - Lil Uzi Vert">New Patek</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };