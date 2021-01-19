class alkatriaPagination {
    constructor(totalSize, perPage, currPage, arrayOfEntries) {
        this.size = {
            "total": totalSize,
            "pPage": perPage
        };
        this.items = arrayOfEntries;
        this.currPage = currPage;
    }
    chunkArray(arr, chunkSize) {
        if (chunkSize <= 0) throw "Invalid chunk size";
        const arrContainer = [];
        for (var i=0,len=arr.length; i<len; i+=chunkSize) container.push(arrContainer.slice(i,i+chunkSize));
        return arrContainer;
    }
    getPages() {
        const pages = Math.ceil(this.size["total"] / this.size["pPage"]);
        return pages;
    }
    getItems(currPage) {
        const pageItems = this.chunkArray(this.items, this.size["pPage"])[currPage];
        return pageItems;
    }
    alkaLogic(totalPages) {
        const currentPage = totalPages;
        const range = 5;
        const totalItems = 10;

        const paging = [];

        let start = 1;

        if (currentPage < (range / 2) + 1 ) {
            start = 1
        } else if (currentPage >= (totalPages - (range / 2) )) {
            start = Math.floor(totalPages - range + 1);
        } else {
            start = (currentPage - Math.floor(range / 2));
        }

        for (let i = start; i <= ((start + range) - 1); i++) {
            if (i === currentPage) {
                paging.push(`<div class="magazine-page current" data-page="${i}">${i}</div>`);
            } else {
                paging.push(`<div class="magazine-page" data-page="${i}">${i}</div>`);
            }
        }
        return paging.join("");
    }
    init() {
        const pages = this.getPages();
        console.log(pages)
        const tableFoot = document.createElement("tfoot");
        tableFoot.innerHTML = `<div id="alkatriaPagination">${this.alkaLogic(pages)}</div>`;
        document.querySelector(".auction-list").appendChild(tableFoot)
    }
}
