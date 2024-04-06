// ==UserScript==
// @name         Servicely Super Menu
// @namespace    http://gofortuna.com
// @version      2.0.1
// @description  Sidebar search enhancements
// @author       You
// @match        https://fortuna.servicely.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=servicely.ai
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/mousetrap/1.6.5/mousetrap.min.js
// @run-at       document-idle
// ==/UserScript==

// Servicely already has jQuery loaded
/* globals jQuery, $, Mousetrap, h */

// Constants
const SCRIPT_NAME = "Servicely Super Menu";
const PKG_NAME = "servicely-super-menu";

const HOTKEYS = [
	["?", "to clear the sidbar menu search bar and give it focus."],
	["up", "to move the sidebar menu focus up the tree."],
	["down", "to move the sidebar menu focus down the tree."],
	["!", "to expand / collapse all top level headings."],
];

function setupMenu() {
	const modalHtml = $(
		[
			`<div id="${PKG_NAME}" class="${PKG_NAME}_modal">`,
			`  <div class="${PKG_NAME}_modal-content">`,
			`    <span class="${PKG_NAME}_close-btn">&times;</span>`,
			`    <h1><i class="fa fa-rocket"></i>${SCRIPT_NAME}</h1>`,
			"    <p>Welcome! This UserScript adds keyboard shortcuts to aid the navigation of Servicely via the keyboard.</p>",
			"    <h2>Current Hotkeys:</h2>",
			...HOTKEYS.map(
				([key, desc]) => `    <p>Press <kbd>${key}</kbd> ${desc}</p>`,
			),
			//'    <p>Press <kbd>?</kbd> to clear the menu search bar and give it focus.</p>',
			"  </div>",
			"</div>",
		].join("\n"),
	);

	console.log("====================================", modalHtml);

	$("body").append(modalHtml);

	const modal = $(`#${PKG_NAME}`);
	$(`.${PKG_NAME}_close-btn`, modal).click(() => modal.hide());

	const newLink = $(
		`<a class="app-header-console-btn" title="${SCRIPT_NAME}" href="#"><i class="fa fa-rocket"></i></a>`,
	);

	$(newLink).click((e) => {
		e.preventDefault();
		modal.show();
	});
	$(".app-header-console-content span a:eq(1)").after(newLink);
}

/**
 * BEGIN SCRIPT
 */
let visibleLinks = [];
let firstTab = true;
let focusedLinkIndex = -1;

function handleTab(isForward) {
	if (firstTab) {
		const links = $("#main-navigation a.menu-application-page-btn:visible");
		if (links.length > 0) {
			visibleLinks = links;
			firstTab = false;
			// Initialize focused index based on the direction
			focusedLinkIndex = isForward ? -1 : 0;
		} else {
			// No visible links to navigate
			return false;
		}
	}

	// Clear current focus
	if (visibleLinks[focusedLinkIndex]) {
		$(visibleLinks[focusedLinkIndex]).removeClass("is-current");
	}

	if (isForward) {
		// Move forward through the list
		focusedLinkIndex++;
		if (focusedLinkIndex >= visibleLinks.length) {
			focusedLinkIndex = 0; // Wrap to the beginning
		}
	} else {
		// Move backward through the list
		focusedLinkIndex--;
		if (focusedLinkIndex < 0) {
			focusedLinkIndex = visibleLinks.length - 1; // Wrap to the end
		}
	}

	if (visibleLinks[focusedLinkIndex]) {
		$(visibleLinks[focusedLinkIndex]).addClass("is-current");
		console.log(`Focusing ${focusedLinkIndex}`);
	}

	return false; // Prevent the default tab behavior
}

function watchDOMForElements(selector, handler) {
	const found = new Promise((resolve, reject) => {
		const observer = new MutationObserver((mutationsList, observer) => {
			const elements = document.querySelectorAll(selector);
			if (elements.length > 0) {
				observer.disconnect();
				resolve(elements);
			}
		});
		observer.observe(document.body, { subtree: true, childList: true });
	});
	return found.then(handler);
}

// biome-ignore lint/complexity/useArrowFunction: <explanation>
(function () {
	jQuery(($) => {
		setupMenu();
	});

	watchDOMForElements(`input[name="search-main-menu"]`, () => {
		setTimeout(() => {
			const search = document.querySelector(`input[name="search-main-menu"]`);
			search.placeholder = "? to focus search ...";
		}, 500);
	});

	Mousetrap.bind("?", () => {
		firstTab = true;
		visibleLinks = [];
		const searchField = $(`input[name="search-main-menu"]`);
		if (searchField) {
			searchField.val("").focus();
		}
	});

	Mousetrap.bind("!", () => {
		const topics = $("#main-navigation li.menu-application-item > a");
		topics.each((idx, heading) => {
			console.log(heading);
			$(heading).click();
		});
	});

	Mousetrap.bind("enter", () => {
		console.log(`Clicking ${focusedLinkIndex}`, visibleLinks[focusedLinkIndex]);
		const href = $(visibleLinks[focusedLinkIndex]).attr("href");
		window.location = href;
	});

	Mousetrap.bind("tab", () => handleTab(true)); // Bind forward tab
	Mousetrap.bind("shift+tab", () => handleTab(false)); // Bind reverse tab

	Mousetrap.bind("down", () => handleTab(true)); // Bind forward tab
	Mousetrap.bind("up", () => handleTab(false)); // Bind reverse tab
})();

GM_addStyle(`
 /* The Modal (background) */
.${PKG_NAME}_modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 9999; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content/Box */
.${PKG_NAME}_modal-content {
  background-color: #fefefe;
  margin: 15% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  border-radius: 6px;
  width: 60%; /* Could be more or less, depending on screen size */
}

.${PKG_NAME}_modal-content h1 {
  margin-top: 0 !important;
}

.${PKG_NAME}_modal-content h1 i {
  margin-right: 15px;
}

/* The Close Button */
.${PKG_NAME}_close-btn {
  color: #aaa;
  display: inline-block;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.${PKG_NAME}_close-btn:hover,
.${PKG_NAME}_close-btn:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
`);
