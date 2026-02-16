#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-public}"
MAX_SIZE="${MAX_SIZE:-}"
QUALITY="${QUALITY:-96}"
MIN_QUALITY="${MIN_QUALITY:-88}"
MAX_QUALITY="${MAX_QUALITY:-95}"
WEBP_METHOD="${WEBP_METHOD:-6}"
WEBP_LOSSLESS="${WEBP_LOSSLESS:-false}"
REOPTIMIZE_WEBP="${REOPTIMIZE_WEBP:-false}"
OVERWRITE_EXISTING="${OVERWRITE_EXISTING:-false}"
MAX_SIZE_BYTES="${MAX_SIZE_BYTES:-102400}"
TARGET_SIZE_KB="${TARGET_SIZE_KB:-}"
TARGET_SIZE_BYTES="${TARGET_SIZE_BYTES:-}"

if ! command -v magick >/dev/null 2>&1; then
	echo "Error: ImageMagick 'magick' is required but was not found in PATH." >&2
	exit 1
fi

if [[ -n "$TARGET_SIZE_KB" ]]; then
	TARGET_SIZE_BYTES="$((TARGET_SIZE_KB * 1024))"
fi

if [[ -n "$TARGET_SIZE_BYTES" ]]; then
	if ! [[ "$TARGET_SIZE_BYTES" =~ ^[0-9]+$ ]] || [[ "$TARGET_SIZE_BYTES" -le 0 ]]; then
		echo "Error: TARGET_SIZE_BYTES must be a positive integer." >&2
		exit 1
	fi
	MAX_SIZE_BYTES="$TARGET_SIZE_BYTES"
fi

if ! [[ "$MAX_SIZE_BYTES" =~ ^[0-9]+$ ]] || [[ "$MAX_SIZE_BYTES" -le 0 ]]; then
	echo "Error: MAX_SIZE_BYTES must be a positive integer." >&2
	exit 1
fi

if ! [[ "$QUALITY" =~ ^[0-9]+$ ]] || [[ "$QUALITY" -lt 1 ]] || [[ "$QUALITY" -gt 100 ]]; then
	echo "Error: QUALITY must be an integer between 1 and 100." >&2
	exit 1
fi

if ! [[ "$MIN_QUALITY" =~ ^[0-9]+$ ]] || [[ "$MIN_QUALITY" -lt 1 ]] || [[ "$MIN_QUALITY" -gt 100 ]]; then
	echo "Error: MIN_QUALITY must be an integer between 1 and 100." >&2
	exit 1
fi

if ! [[ "$MAX_QUALITY" =~ ^[0-9]+$ ]] || [[ "$MAX_QUALITY" -lt 1 ]] || [[ "$MAX_QUALITY" -gt 100 ]]; then
	echo "Error: MAX_QUALITY must be an integer between 1 and 100." >&2
	exit 1
fi

if [[ "$MIN_QUALITY" -gt "$MAX_QUALITY" ]]; then
	echo "Error: MIN_QUALITY cannot be greater than MAX_QUALITY." >&2
	exit 1
fi

encode_once() {
	local input="$1"
	local output="$2"
	local quality="$3"
	local cmd=(magick "$input" -strip)

	if [[ -n "$MAX_SIZE" ]]; then
		cmd+=(-resize "$MAX_SIZE")
	fi

	if [[ "$WEBP_LOSSLESS" == "true" ]]; then
		cmd+=(-define webp:lossless=true -define "webp:method=$WEBP_METHOD")
	else
		cmd+=(-quality "$quality" -define "webp:method=$WEBP_METHOD")
	fi

	"${cmd[@]}" "$output"
}

encode_for_target() {
	local input="$1"
	local output="$2"
	local target_bytes="$3"
	local low="$MIN_QUALITY"
	local high="$MAX_QUALITY"
	local mid=0
	local size=0
	local best_quality=""
	local best_size=""
	local best_file=""
	local candidate=""
	local tmp_dir

	tmp_dir="$(mktemp -d)"

	while (( low <= high )); do
		mid=$(((low + high) / 2))
		candidate="$tmp_dir/$mid.webp"
		encode_once "$input" "$candidate" "$mid"
		size="$(stat -c%s "$candidate")"

		if [[ "$size" -le "$target_bytes" ]]; then
			best_quality="$mid"
			best_size="$size"
			best_file="$candidate"
			low=$((mid + 1))
		else
			high=$((mid - 1))
		fi
	done

	if [[ -z "$best_file" ]]; then
		rm -rf "$tmp_dir"
		return 1
	fi

	mv "$best_file" "$output"
	rm -rf "$tmp_dir"
	echo "$best_quality:$best_size"
}

found=0
optimized=0
skipped=0

find_args=(
	find "$TARGET_DIR" -type f
	\( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png'
)

if [[ "$REOPTIMIZE_WEBP" == "true" ]]; then
	find_args+=(-o -iname '*.webp')
fi

find_args+=(\) -print0)

while IFS= read -r -d '' img; do
	found=1
	ext="${img##*.}"
	ext="${ext,,}"
	orig_size=$(stat -c%s "$img")

	if [[ "$orig_size" -le "$MAX_SIZE_BYTES" ]]; then
		echo "skipped: $img (${orig_size} bytes <= ${MAX_SIZE_BYTES} bytes threshold)"
		skipped=$((skipped + 1))
		continue
	fi

	if [[ "$ext" == "webp" ]]; then
		out="$img"
	else
		out="${img%.*}.webp"
		if [[ -f "$out" && "$OVERWRITE_EXISTING" != "true" && "$img" -ot "$out" ]]; then
			echo "skipped: $img (output exists: $out)"
			skipped=$((skipped + 1))
			continue
		fi
	fi

	if [[ -n "$TARGET_SIZE_BYTES" && "$WEBP_LOSSLESS" != "true" ]]; then
		tmp_out="${out%.*}.tmp.$$.webp"

		if target_result="$(encode_for_target "$img" "$tmp_out" "$TARGET_SIZE_BYTES")"; then
			target_quality="${target_result%%:*}"
			new_size="${target_result##*:}"

			if [[ "$ext" == "webp" && "$new_size" -ge "$orig_size" ]]; then
				rm -f "$tmp_out"
				echo "skipped: $img (not smaller after target encode: $orig_size -> $new_size bytes)"
				skipped=$((skipped + 1))
				continue
			fi

			mv "$tmp_out" "$out"
			if [[ "$ext" == "webp" ]]; then
				echo "optimized: $img ($orig_size -> $new_size bytes, q=$target_quality, target=${TARGET_SIZE_BYTES})"
			else
				echo "optimized: $img -> $out ($new_size bytes, q=$target_quality, target=${TARGET_SIZE_BYTES})"
			fi
			optimized=$((optimized + 1))
		else
			rm -f "$tmp_out"
			echo "skipped: $img (cannot hit ${TARGET_SIZE_BYTES} bytes without going below quality ${MIN_QUALITY})"
			skipped=$((skipped + 1))
		fi
		continue
	fi

	if [[ "$ext" == "webp" ]]; then
		tmp="${img%.*}.tmp.$$.webp"
		encode_once "$img" "$tmp" "$QUALITY"
		new_size="$(stat -c%s "$tmp")"

		if [[ "$new_size" -lt "$orig_size" ]]; then
			mv "$tmp" "$img"
			echo "optimized: $img ($orig_size -> $new_size bytes)"
			optimized=$((optimized + 1))
		else
			rm -f "$tmp"
			echo "skipped: $img (optimized file is larger: $orig_size -> $new_size bytes)"
			skipped=$((skipped + 1))
		fi
	else
		encode_once "$img" "$out" "$QUALITY"
		echo "optimized: $img -> $out"
		optimized=$((optimized + 1))
	fi
done < <("${find_args[@]}")

if [[ "$found" -eq 0 ]]; then
	if [[ "$REOPTIMIZE_WEBP" != "true" ]]; then
		webp_sample="$(find "$TARGET_DIR" -type f -iname '*.webp' -print -quit)"
		if [[ -n "$webp_sample" ]]; then
			echo "No PNG/JPG/JPEG images found in $TARGET_DIR"
			echo "Hint: WEBP files exist. Re-run with REOPTIMIZE_WEBP=true or use: bun run optimize:webp -- $TARGET_DIR"
			exit 0
		fi
	fi
	echo "No PNG/JPG/JPEG/WEBP images found in $TARGET_DIR"
else
	echo "Done. optimized: $optimized, skipped: $skipped"
fi
