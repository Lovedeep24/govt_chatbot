# from flask import Blueprint, request, jsonify
# import os
# import subprocess

# audio_bp = Blueprint(
#     "audio",
#     __name__,
#     url_prefix="/api/audio"
# )

# @audio_bp.route("/", methods=["POST"])
# def upload_audio():

#     if "audio" not in request.files:
#         return jsonify({
#             "error": "No audio uploaded"
#         }), 400

#     audio_file = request.files["audio"]

#     os.makedirs("temp", exist_ok=True)

#     webm_path = os.path.join(
#         "temp",
#         audio_file.filename
#     )

#     audio_file.save(webm_path)

#     wav_path = webm_path.replace(".webm", ".wav")

#     subprocess.run([
#         "ffmpeg",
#         "-y",
#         "-i",
#         webm_path,
#         wav_path
#     ], check=True)

#     print("WEBM:", webm_path)
#     print("WAV:", wav_path)

#     return jsonify({
#         "success": True,
#         "wav_path": wav_path
#     })




from flask import Blueprint, request, jsonify
import os
import subprocess
import requests

audio_bp = Blueprint(
    "audio",
    __name__,
    url_prefix="/api/audio"
)

@audio_bp.route("/", methods=["POST"])
def upload_audio():

    if "audio" not in request.files:
        return jsonify({
            "error": "No audio uploaded"
        }), 400

    audio_file = request.files["audio"]

    os.makedirs("temp", exist_ok=True)

    webm_path = os.path.join(
        "temp",
        audio_file.filename
    )

    audio_file.save(webm_path)

    wav_path = webm_path.replace(".webm", ".wav")

    subprocess.run([
        "ffmpeg",
        "-y",
        "-i",
        webm_path,
        wav_path
    ], check=True)

    # Send WAV file to another API
    with open(wav_path, "rb") as f:
        files = {
            "audio": (
                os.path.basename(wav_path),
                f,
                "audio/wav"
            )
        }

        response = requests.post(
            "http://127.0.0.1:8000/audio/transcribe",
            files=files
        )
        print("final_trans_res",response)
    return jsonify({
        "success": True,
        "transcription_response": response.json()
    })