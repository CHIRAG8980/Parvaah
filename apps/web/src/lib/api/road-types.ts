import { RoadStatus } from './types';

export interface RoadSegmentResponse {
  road_id: string;
  name: string;
  road_class: string;
  zone_id: string;
  status: RoadStatus;
  blockage_reason?: string | null;
  start_point?: string | null;
  end_point?: string | null;
  is_single_access?: boolean;
  status_updated_at?: string;
}

export interface RerouteRequest {
  origin: string;
  destination: string;
  current_zone_id?: string;
}

export interface RerouteResponse {
  origin: string;
  destination: string;
  direct_route_status: RoadStatus;
  alternate_route_available: boolean;
  suggested_route_name: string;
  advisory_notes: string;
  estimated_distance_km: number;
  estimated_duration_mins: number;
  safe_corridor_waypoints: string[];
}
