# TODO: Integrate Hugging Face AI Models

## Steps to Complete
- [x] Update backend/requirements.txt with new dependencies: requests, youtube-transcript-api, easyocr
- [x] Modify backend/app.py:
  - [x] Add necessary imports (os, requests, easyocr, youtube_transcript_api)
  - [x] Add summarize_text(text) function using facebook/bart-large-cnn
  - [x] Add generate_mcqs(summary) function using iarfmoose/t5-base-question-generator
  - [x] Update /upload-image endpoint: implement OCR, summarize, generate MCQs
  - [x] Update /youtube-process endpoint: fetch transcript, summarize, generate MCQs
- [x] Remove dummy functions: build_image_summary, build_image_mcqs, build_youtube_payload
- [x] Install updated dependencies
- [ ] Set HUGGINGFACE_API_KEY environment variable
- [ ] Test endpoints with sample inputs
