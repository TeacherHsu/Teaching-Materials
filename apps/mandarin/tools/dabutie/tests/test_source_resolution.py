"""重現並鎖住「匯入器重跑歸零」的 bug（規格 A）：
- 來源根目錄找不到「1.備課資料」時，必須大聲失敗（丟例外/非 0 exit），
  不得讓各抽取器各自靜默回傳空資料，導致最終 lesson JSON 全部欄位為 0 卻 exit 0。
- 路徑比對一律先 NFC 正規化，容忍 unzip / ditto / Finder 解壓造成的檔名編碼差異。
用合成 fixture（暫存資料夾），不依賴大補帖原文。
"""
import unicodedata

import pytest

from common import SourceNotFoundError, resolve_path
import import_lesson


def test_resolve_path_raises_on_missing_root(tmp_path):
    with pytest.raises(SourceNotFoundError) as exc:
        resolve_path(tmp_path, "1.備課資料")
    assert "1.備課資料" in str(exc.value)


def test_resolve_path_tolerates_nfd_vs_nfc(tmp_path):
    """模擬解壓工具給出正規化形式不同、但視覺相同的檔名。"""
    nfd_name = unicodedata.normalize("NFD", "02各冊生字")
    (tmp_path / "1.備課資料" / nfd_name).mkdir(parents=True)
    nfc_query = unicodedata.normalize("NFC", "02各冊生字")
    found = resolve_path(tmp_path, "1.備課資料", nfc_query)
    assert found.exists()


def test_import_fails_loudly_on_empty_src(tmp_path, capsys):
    """對應規格 A 的實際案例：zip 用 unzip（Info-ZIP）解壓中文檔名失敗，
    產生空的/不完整的來源資料夾。匯入器不得靜默寫出全 0 的 lesson JSON。"""
    bad_src = tmp_path / "bad_src"
    bad_src.mkdir()
    work = tmp_path / "work"
    out = work / "lesson01.json"

    with pytest.raises(SystemExit) as exc:
        import_lesson.run_extractors(bad_src, 1, work, "")

    assert exc.value.code != 0
    assert not out.exists()
    err = capsys.readouterr().err
    assert "1.備課資料" in err
    assert "unzip" in err or "ditto" in err


def test_import_succeeds_with_real_folder_structure_even_when_lesson_missing(tmp_path):
    """來源根目錄存在且結構正確，但這一課剛好沒有某來源檔案：屬於「這課本來就沒有
    這筆資料」的軟性情況，應回傳 status missing/todo，而不是整體硬失敗。"""
    src = tmp_path / "src"
    (src / "1.備課資料" / "16聆聽練習").mkdir(parents=True)
    (src / "1.備課資料" / "02各冊生字").mkdir(parents=True)
    # 02各冊生字 沒放任何 docx：characters extractor 應回傳 missing，而不是丟例外
    import extractors.characters as ex_characters

    result = ex_characters.extract(src, 1)
    assert result["status"] == "missing"
