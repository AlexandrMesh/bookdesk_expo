from pathlib import Path

FILES = [
    'src/utils/database/boardData.ts',
    'src/screens/Main/index.tsx',
    'src/utils/database/statistics.ts',
    'src/utils/database/database.ts',
    'src/redux/actions/authActions.ts',
    'src/redux/actions/booksActions.ts',
    'src/redux/actions/goalsActions.ts',
    'src/utils/database/profile.ts',
    'src/screens/CustomBooks/EditCustomBook/index.tsx',
    'src/utils/database/goals.ts',
    'src/utils/database/categories.ts',
    'src/utils/database/books.ts',
    'src/utils/database/bookVotes.ts',
    'src/utils/database/bookRatings.ts',
    'src/utils/database/bookNotes.ts',
    'src/utils/database/bookDates.ts',
    'src/screens/Home/InProgressBooks/index.tsx',
    'src/screens/Home/CoverViewer/index.tsx',
    'src/redux/selectors/books.ts',
    'src/redux/reducers/booksReducer.ts',
    'src/UI/BannerAd/index.tsx',
]

STRING_DELIMS = {'"', "'", '`'}

def strip_console_logs(text: str) -> str:
    result = []
    i = 0
    length = len(text)
    while True:
        idx = text.find('console.log', i)
        if idx == -1:
            result.append(text[i:])
            break
        line_start = text.rfind('\n', 0, idx)
        block_start = 0 if line_start == -1 else line_start + 1
        prev_newline = text.rfind('\n', 0, block_start - 1)
        if prev_newline != -1:
            prev_line = text[prev_newline + 1:block_start - 1]
            if 'eslint-disable-next-line no-console' in prev_line:
                block_start = prev_newline + 1
        result.append(text[i:block_start])
        pos = idx + len('console.log')
        while pos < length and text[pos].isspace():
            pos += 1
        if pos >= length or text[pos] != '(':
            i = pos
            continue
        depth = 0
        in_string = None
        escape = False
        while pos < length:
            ch = text[pos]
            if in_string:
                if escape:
                    escape = False
                elif ch == '\\\\':
                    escape = True
                elif ch == in_string:
                    in_string = None
                pos += 1
                continue
            if ch in STRING_DELIMS:
                in_string = ch
                pos += 1
                continue
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
                if depth == 0:
                    pos += 1
                    break
            pos += 1
        while pos < length and text[pos].isspace():
            pos += 1
        if pos < length and text[pos] == ';':
            pos += 1
        while pos < length and text[pos] in ' \t':
            pos += 1
        if pos < length and text[pos] == '\r':
            pos += 1
        if pos < length and text[pos] == '\n':
            pos += 1
        i = pos
    return ''.join(result)

for file in FILES:
    path = Path(file)
    if not path.exists():
        continue
    original = path.read_text(encoding='utf-8')
    updated = strip_console_logs(original)
    if updated != original:
        path.write_text(updated, encoding='utf-8')
