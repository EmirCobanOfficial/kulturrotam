"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMyPhotoVotes,
  fetchPhotos,
  fetchPlaces,
  photoUrl,
  uploadPhoto,
  votePhoto,
} from "@/lib/data";
import { placeName, useLang } from "@/lib/i18n";
import { errorText } from "@/lib/errors";
import { ensureSession, supabaseConfigured } from "@/lib/supabase/client";
import type { Photo, Place } from "@/lib/types";

export default function FeedPage() {
  const { lang, t } = useLang();
  const [places, setPlaces] = useState<Place[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [placeId, setPlaceId] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setError("Supabase ayarlı değil (.env.local eksik).");
      return;
    }
    try {
      await ensureSession();
      const [placeRows, photoRows, votes] = await Promise.all([
        fetchPlaces(),
        fetchPhotos(),
        fetchMyPhotoVotes(),
      ]);
      setPlaces(placeRows);
      setPhotos(photoRows);
      setVotedIds(new Set(votes));
      if (!placeId && placeRows.length > 0) setPlaceId(placeRows[0].id);
    } catch (e) {
      setError(errorText(e));
    }
    // placeId sadece ilk yuklemede varsayilan atanir; bagimlilik olarak eklenmez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError(t("feed_need_file"));
      return;
    }
    setBusy(true);
    try {
      await uploadPhoto(placeId, file, caption);
      setFile(null);
      setCaption("");
      if (fileInput.current) fileInput.current.value = "";
      setPhotos(await fetchPhotos());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function onVote(photo: Photo) {
    if (votedIds.has(photo.id)) return;
    try {
      const votes = await votePhoto(photo.id);
      setVotedIds(new Set([...votedIds, photo.id]));
      setPhotos((rows) => rows.map((r) => (r.id === photo.id ? { ...r, votes } : r)));
    } catch (e) {
      setError(errorText(e));
    }
  }

  const placeById = new Map(places.map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t("feed_title")}</h1>
      <p className="mt-1 text-muted">{t("feed_lead")}</p>

      <form onSubmit={onUpload} className="mt-6 rounded-xl border border-line bg-surface p-4">
        <label className="block text-sm font-semibold" htmlFor="place-select">
          {t("feed_place")}
        </label>
        <select
          id="place-select"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
        >
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {placeName(p, lang)}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="photo-input">
          {t("feed_file")}
        </label>
        <input
          id="photo-input"
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm"
        />

        <label className="mt-4 block text-sm font-semibold" htmlFor="caption-input">
          {t("feed_caption")}
        </label>
        <input
          id="caption-input"
          value={caption}
          maxLength={120}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
        />

        <button
          type="submit"
          disabled={busy || !placeId}
          className="mt-4 rounded-full bg-brand px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          {busy ? t("feed_uploading") : t("feed_upload")}
        </button>

        {error && <p className="mt-3 text-sm text-accent">{error}</p>}
      </form>

      {photos.length === 0 ? (
        <p className="mt-8 text-muted">{t("feed_empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {photos.map((photo) => {
            const place = placeById.get(photo.place_id);
            const voted = votedIds.has(photo.id);
            return (
              <li key={photo.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                {/* Supabase Storage genel URL'i; next/image yerine img, uzak host ayarı gerekmesin diye. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(photo.storage_path)}
                  alt={photo.caption ?? (place ? placeName(place, lang) : "")}
                  className="h-48 w-full object-cover"
                />
                <div className="p-3">
                  <p className="font-semibold">{place ? placeName(place, lang) : ""}</p>
                  {photo.caption && <p className="mt-1 text-sm text-muted">{photo.caption}</p>}
                  <button
                    onClick={() => onVote(photo)}
                    disabled={voted}
                    className="mt-3 rounded-full border border-line px-3 py-1 text-sm font-semibold hover:bg-brand-soft disabled:opacity-60"
                  >
                    {voted ? t("feed_voted") : t("feed_vote")} · {photo.votes}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
