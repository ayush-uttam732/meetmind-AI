import { useEffect, useState } from "react";
import type { MeetingRecord } from "../types/meeting";
import { getMeeting, listMeetings } from "../services/meetingService";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useMeetings(): AsyncState<MeetingRecord[]> {
  const [state, setState] = useState<AsyncState<MeetingRecord[]>>({
    data: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    listMeetings()
      .then((data) => !cancelled && setState({ data, loading: false, error: "" }))
      .catch(
        (error) =>
          !cancelled && setState({ data: [], loading: false, error: messageOf(error) })
      );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useMeeting(id: string): AsyncState<MeetingRecord | null> {
  const [state, setState] = useState<AsyncState<MeetingRecord | null>>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: "" });
    getMeeting(id)
      .then((data) => !cancelled && setState({ data, loading: false, error: "" }))
      .catch(
        (error) =>
          !cancelled && setState({ data: null, loading: false, error: messageOf(error) })
      );
    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}