import Showdown from "showdown";
import showdownHighlight from "showdown-highlight";
import showdownKatex from "showdown-katex";
import mermaid from "mermaid";
import embed from "vega-embed";

/** 
 * When this is defined, we have a class name, and we want each H1 or H2 to be
 * in a div with that class
 */
let divWrapper = "";

/** Use a regex to extract a line from a content string and return part of it */
function extract(r, content) {
    let x = r.exec(content);
    let cssClass = "";
    if (x != null) {
        content = content.replace(r, "");
        cssClass = "class='" + x[1] + "'";
    }
    return { cssClass, cleanedContent: content };
}

/** 
 * If there is a line of the form @class="...", extract the content between the
 * quotation marks, and then return a pair consisting of the original input
 * (without the @class line) and the class content.
 */
function extractClassFromContent(content) { return extract(/@class="([\S\s]+)"/, content); }

/**
 * Pull the first word out of a content string so we can treat it as a CSS class
 */
function extractFirstFromContent(content) { return extract(/([\S]+)/, content); }

/**
 * An extension that finds code blocks for the "vega" language.  Instead of
 * passing them to HighlightJS, these blocks get turned into Vega charts
 *
 * NB: Our Vega extension supports a @class line for giving the outer div a
 *     custom class.
 */
let extVega = {
    type: "lang",
    regex: /(```vega)([\s\S]+?)(```)/g,
    idx: 0, // NB: we could use _location, but a counter is more deterministic
    // NB:  `whole` is the whole matched thing, left is the first (), content is
    //      the second (), right is the third (), location is the rough
    //      character position of the start of the matched thing, and text is
    //      the whole MD file, such that `whole` begins at position `location`
    //      of `text`.
    replace: function (_whole, _left, content, _right, _location, _text) {
        let { cssClass, cleanedContent } = extractClassFromContent(content);
        // Create the div into which we'll render the Vega chart, give it a
        // unique id.
        let d = document.createElement("div");
        d.id = "vega-div-" + extVega.idx;
        let id = extVega.idx;
        // Parse the content as JSON, pass it to Vega for async rendering
        embed(d, JSON.parse(cleanedContent)).then(value => {
            // The callback will look for the temp div that we return from this
            // function, and will replace it with the one that has the chart
            let tgt = document.getElementById("vega-tmp-div-" + id);
            tgt.parentElement.replaceChild(d, tgt);
        });
        // Return a temp div, which gets replaced when the (async) Vega task
        // finishes
        return "<div " + cssClass + " id='vega-tmp-div-" + extVega.idx++ + "'>hi</div>"
    }
};

/**
 * An extension that finds code blocks for the "mermaid" language.  Instead of
 * passing them to HighlightJS, these blocks get turned into Mermaid diagrams.
 *
 * NB: Our Mermaid extension supports a @class line for giving the outer div a
 *     custom class.
 */
let extMermaid = {
    type: "lang",
    regex: /(```mermaid)([\s\S]+?)(```)/g,
    idx: 0,
    replace: function (_whole, _left, content, _right, _location, _text) {
        let { cssClass, cleanedContent } = extractClassFromContent(content);
        // Create a temporary div with a unique Id, in which mermaid can work.
        // We need this because the Mermaid API likes to work with id-qualified
        // div elements.
        let d = document.createElement("div");
        d.id = "mermaid-object-" + extMermaid.idx;
        // When we render, Mermaid returns the innerHtml of the div, which we
        // then put into a more appropriately named and classed div.
        let tmp = mermaid.render(d.id, cleanedContent)
        return "<div " + cssClass + " id='mermaid-div-" + extMermaid.idx++ + "'>" + tmp + "</div>";
    }
};

/**
 * An extension that repurposes a code block for the "iframe" language into an
 * iframe.  The format for the content is a json object, with valid keys being
 * `width`, `height`, `class`, `src`.
 */
let extIframe = {
    type: "lang",
    regex: /(```iframe)([\s\S]+?)(```)/g,
    idx: 0,
    replace: function (_whole, _left, content, _right, _location, _text) {
        let args = JSON.parse(content);
        let iClass = args["class"] ?? "",
            iWidth = args["width"] ?? "no width provided",
            iHeight = args["height"] ?? "no height provided",
            iSrc = args["src"] ?? "no src provided";
        let id = extIframe.idx++;
        return `<iframe id=${id} class="${iClass}" width="${iWidth}" height="${iHeight}" src="${iSrc}"></iframe>`
    }
};

/** 
 * An extension that finds blocks wrapped in @@ and turns them into spans
 * 
 * NB: The first word after the @@ is the class of the span
 */
let extSpan = {
    type: "lang",
    regex: /(@@)([\s\S]+?)(@@)/g,
    replace: function (_whole, _left, content, _right, _location, _text) {
        // Extract the word after @@ and use it as the class for a span
        let { cssClass, cleanedContent } = extractFirstFromContent(content);
        return "<span " + cssClass + ">" + cleanedContent + "</span>";
    }
};

/** 
 * An extension that appends a bunch of classes to the next tag that showdown
 * produces 
 * 
 * NB: Sometimes you need the class to precede the line of the markdown
 * -  #[.class] Title
 * -  [.class] line of text
 * -  [.list]
 *    1. item 1
 */
let extClass = {
    type: 'output',
    filter: function (text) {
        return text
            // Add class for list (ol, ul) -- there's a <p> before the list
            .replace(/<p>\[\.([a-z0-9A-Z\s]+)\]<\/p>[\n]?<(.+)>/g, `<$2 class="$1">`)

            // Add class for other blocks, where there isn't a leading <p>
            .replace(/<(.+)>\[\.([a-z0-9A-Z\s]+)\]/g, `<$1 class="$2">`)

            // Prevent class name with 2 dashes being replace by `<em>` tag
            .replace(/class="(.+)"/g, function (str) {
                if (str.indexOf("<em>") !== -1)
                    return str.replace(/<[/]?em>/g, '_');
                return str;
            });
    }
};

/** An extension that finds a markdown configuration block and parses it */
let extConfig = {
    type: "lang",
    regex: /(```md-config)([\s\S]+?)(```)/g,
    replace: function (_whole, _left, content, _right, _location, _text) {
        let divRE = /div-wrapper-class = ([\S]+)\n/
        let titleRE = /page-title = ([\S ]+)\n/

        let tmp = divRE.exec(content);
        if (tmp != null) {
            content = content.replace(divRE, "");
            divWrapper = tmp[1];
        }

        tmp = titleRE.exec(content);
        if (tmp != null) {
            content = content.replace(titleRE, "");
            document.title = tmp[1];
        }

        let style = document.createElement("style");
        style.type = 'text/css';
        document.head.appendChild(style);
        style.appendChild(document.createTextNode(content))
        return "";
    }
};

/**
 * For each H1 or H2 in the rendered Markdown, take that H1 or H2, and all of
 * the things that follow it, and put them into a div.  This lets us style whole
 * sections.
 *
 * @param className The class to assign to all div tags created by this function
 */
function wrapMarkdownInSections(className) {
    // We start by extracting, in order, all children from the body of the doc
    let oldChildren = []
    while (document.body.children.length > 0) {
        oldChildren.push(document.body.children[0]);
        document.body.removeChild(document.body.children[0]);
    }
    // Now we can iterate through the children and put them into new parent
    // containers.  Be sure to start a new container each time we hit a new H1
    // or H2.
    let newChildren = [], currDiv = document.createElement("div"), i = 0;
    currDiv.id = "div-" + i++;
    for (let elt of oldChildren) {
        if ((elt instanceof HTMLHeadingElement) && (elt.tagName === "H1" || elt.tagName === "H2")) {
            if (currDiv.children.length > 0) newChildren.push(currDiv)
            currDiv = document.createElement("div");
            currDiv.id = "div-" + i++;
            currDiv.classList.add(className)
        }
        currDiv.appendChild(elt);
    }
    newChildren.push(currDiv); // don't forget the last one!

    // Now put the container div elements into the body of the doc
    for (let e of newChildren)
        document.body.appendChild(e);
}

/** Given some markdown, parse it and overwrite the document with the result */
function replaceDocument(markdown) {
    // We turn on a lot of built-in extensions
    let converter = new Showdown.Converter({
        tables: true, tablesHeaderId: true,
        underline: true, strikethrough: true, tasklists: true,
        openLinksInNewWindow: true, emoji: true,
        // ![foo](foo.jpg =100x80)   simple, assumes units are in px
        // ![bar](bar.jpg =100x*)    sets the height to "auto"
        // ![baz](baz.jpg =80%x5em)  Image with width of 80% and height of 5em
        parseImgDimensions: true,
        // Load the public HighlightJS and KaTeX extensions, plus the ones I
        // wrote.
        extensions: [
            showdownKatex({
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: '$', right: '$', display: false },
                ],
            }),
            showdownHighlight({ pre: true }),
            extIframe, extMermaid, extVega, extSpan, extClass, extConfig,
        ]
    });

    // Use showdown to produce HTML from MD, and make it the document body
    document.body.innerHTML = converter.makeHtml(markdown);

    if (divWrapper !== "")
        wrapMarkdownInSections(divWrapper);
}

/*** Use the address bar to find a markdown file, fetch it, and format it */
function fetchMarkdownAndReplaceDocument() {
    // The name of the markdown file follows the '#' in the address bar
    let mda = window.location.href.split("#");
    if (mda.length == 1) return;

    // Fetch the markdown file **as text** and process it
    fetch("./" + mda[1]).then(res => res.text()).then(replaceDocument);
}

// NB: Fetching will also run any configs, which will initiate div wrapping
// NB: preventAutoFetch is undefined by default
if (typeof preventAutoFetch === 'undefined')
    fetchMarkdownAndReplaceDocument();

// This is a hack to export replaceDocument and fetchMarkdownAndReplaceDocument.
// Useful when preventAutoFetch is true
window.replaceDocument = replaceDocument;
window.fetchMarkdownAndReplaceDocument = fetchMarkdownAndReplaceDocument;