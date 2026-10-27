import re
from dataclasses import dataclass

# An original file on Wikimedia Commons, in a format Commons makes thumbnails of in the same format.
COMMONS_FILE = re.compile(
    r'^https://upload\.wikimedia\.org/wikipedia/commons/'
    r'(?P<directory>[0-9a-f]/[0-9a-f]{2})/(?P<name>[^/?#]+\.(?:jpe?g|png|webp))$',
    re.IGNORECASE,
)

# The page that credits a file, which the recipe page links to as "Wikimedia Commons".
COMMONS_FILE_PAGE = re.compile(r'^https://commons\.wikimedia\.org/wiki/File:[^/?#]+$')

# Widths Commons keeps thumbnails at, from a card on a phone to a recipe's photo on a large screen.
THUMBNAIL_WIDTHS = (330, 500, 960, 1280)


@dataclass(frozen=True)
class Thumbnail:
    width: int
    url: str


@dataclass(frozen=True)
class Photo:
    url: str
    author: str
    licence: str
    source_url: str

    @property
    def thumbnails(self) -> list[Thumbnail]:
        match = COMMONS_FILE.match(self.url)
        if match is None:
            return []
        directory, name = match['directory'], match['name']
        return [
            Thumbnail(
                width, f'https://upload.wikimedia.org/wikipedia/commons/thumb/{directory}/{name}/{width}px-{name}'
            )
            for width in THUMBNAIL_WIDTHS
        ]
