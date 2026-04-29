sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/example/books/test/integration/pages/BooksList",
	"com/example/books/test/integration/pages/BooksObjectPage"
], function (JourneyRunner, BooksList, BooksObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/example/books') + '/test/flp.html#app-preview',
        pages: {
			onTheBooksList: BooksList,
			onTheBooksObjectPage: BooksObjectPage
        },
        async: true
    });

    return runner;
});

