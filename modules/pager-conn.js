//let pagers = pager(2, 90, {listCnt: 5, pagerCnt: 5})

const pager = (page, totalRecord, obj) => {
  page = Number(page);
  totalPage = Number(totalPage);
  let {listCnt = 5, pagerCnt = 3} = obj || {};
  let totalPage = Math.ceil(totalRecord / listCnt);
  let startIdx = (page - 1) * listCnt;
  let startPage = Math.floor((page - 1) / pagerCnt) * pagerCnt + 1;
  let endPage = startPage + pagerCnt - 1 > totalPage ? totalPage : startPage + pagerCnt - 1;
  let nextPage = page + 1 > totalPage ? totalPage : page + 1;
  let prevPage = page - 1;
  return {page, totalRecord, listCnt, pagerCnt, totalPage, startIdx, startPage, endPage, nextPage, prevPage};
};

module.exports = pager;