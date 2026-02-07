import easyocr


_READER = None


def _get_reader():
    global _READER
    if _READER is None:
        _READER = easyocr.Reader(["en"], gpu=False)
    return _READER


def extract_text_from_image(image_path: str) -> str:
    reader = _get_reader()
    results = reader.readtext(image_path, detail=0)
    return "\n".join(results)
