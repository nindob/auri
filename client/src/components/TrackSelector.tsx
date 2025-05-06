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
        <Select
          value={selectedTrack}
          onValueChange={onTrackChange}
          defaultValue="/4EVA.mp3"
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select track" />
          </SelectTrigger>
        <SelectContent>
          <SelectItem value="/4EVA.mp3">4EVA</SelectItem>
          <SelectItem value="/love for you.mp3">Love for You</SelectItem>
          <SelectItem value="/New Patek.mp3">New Patek</SelectItem>
        </SelectContent>
        </Select>
      </div>
    );
  };