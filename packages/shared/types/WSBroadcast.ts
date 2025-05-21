import { z } from "zod";
import { PauseActionSchema, PlayActionSchema } from "./WSRequest";

const ClientSchema = z.object({
  username: z.string(),
  clientId: z.string(),
  ws: z.any(),
  rtt: z.number().nonnegative().default(0), // Round-trip time in milliseconds
});

export type ClientType = z.infer<typeof ClientSchema>;

const ClientChangeMessageSchema = z.object({
  type: z.literal("CLIENT_CHANGE"),
  clients: z.array(ClientSchema),
});

const AudioSourceSchema = z.object({
  type: z.literal("NEW_AUDIO_SOURCE"),
  id: z.string(),
  title: z.string(),
  duration: z.number().positive(),
  thumbnail: z.string().url().optional(),
  addedAt: z.number(),
  addedBy: z.string(),
});
export type AudioSourceType = z.infer<typeof AudioSourceSchema>;

const SpatialConfigSchema = z.object({
  type: z.literal("SPATIAL_CONFIG"),
  gains: z.record(
    z.string(),
    z.object({ gain: z.number().min(0).max(1), rampTime: z.number() })
  ),
});

export type SpatialConfigType = z.infer<typeof SpatialConfigSchema>;

const ScheduledActionSchema = z.object({
  type: z.literal("SCHEDULED_ACTION"),
  serverTimeToExecute: z.number(),
  scheduledAction: z.discriminatedUnion("type", [
    PlayActionSchema,
    PauseActionSchema,
    SpatialConfigSchema,
  ]),
});

const RoomEventSchema = z.object({
  type: z.literal("ROOM_EVENT"),
  event: z.discriminatedUnion("type", [
    ClientChangeMessageSchema,
    AudioSourceSchema,
  ]),
});

// HERE
export const WSBroadcastSchema = z.discriminatedUnion("type", [
  ScheduledActionSchema,
  RoomEventSchema,
]);
export type WSBroadcastType = z.infer<typeof WSBroadcastSchema>;