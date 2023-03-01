/// TODO: [refactoring][remove after merge with src/utils/book-chapter-path-utils.ts]


const toIndex = (index, length = 3, symbol = `0`) =>
    symbol.repeat(length - index.toString().length).concat(index.toString());
const toChapterName = (index, section, title) =>
    `${toIndex(index)}.(${section}) ${title}`;
const bookChapterNameRemoveIndex = chapterName => chapterName.replace(/^\d{3}\./, '');
const bookChapterNameAddOnlyIndex = (index, chapterName) => `${toIndex(index)}.${chapterName}`;
const bookChapterDirToChapterName = chapterDir => chapterDir.replace(/^\d{3}\.\(.*?\)\s+/, '');

const getHeading = content => Array.from(content.matchAll(/^(?:#{1,2})\s(.+)\s*$/gm))
    .map(([, heading]) => heading.trim());


module.exports = {
    toIndex,
    toChapterName,
    bookChapterNameRemoveIndex,
    bookChapterNameAddOnlyIndex,
    bookChapterDirToChapterName,
    getHeading,
};

