/**
 * Brains of the operation here. On first load on twitter.com, load jquery up in
 * noconcflict mode (tends to kill other extensions otherwise, namely Web Developer
 * toolbar).
 * When on twitter.com, attach the media type definitions and subsequent loading
 * actions on tweet expansion.
 *
 * Currently supported sites:
 * - adverts.ie
 * - daft.ie
 * - imgur.com
 */
var declutterTwitter = function () {
    return {
        filters: {},
        init : function () {
            gBrowser.addEventListener("load", function (event) {
                var dcTab = window.top.getBrowser().selectedBrowser.contentWindow.location.href;

                // By default, assume we're not on twitter
                var onTwitter = false;

                // Only run on pages with urls beginning http://twitter.com or http://api.twitter.com
                // Don't run on https as we're pulling insecure content in previews
                onTwitter = ( (dcTab.indexOf('http://twitter.com') == 0) || (dcTab.indexOf('http://api.twitter.com') == 0) );

                // Run automatically on twitter
                if (onTwitter) {

                    // Just want to load jQuery the one time
                    if(!declutterTwitter.jQuery)
                    {
                        var jsLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);

                        // Load jquery in to the twitterMediaPreview namespace
                        jsLoader.loadSubScript("chrome://decluttertwitter/content/jquery-1.4.4.min.js", declutterTwitter);

                        // Set up noconflict jQuery so we don't kill other extensions
                        // tmp.jQuery is coming up as undefined after loader above, despite NS being set.
                        // Get around this by explicitly assigning it here.
                        declutterTwitter.jQuery = jQuery.noConflict(true);
                    }

                }
            }, false);
        },

        removeTweets : function () {
            // @TODO: Pull these from settings
            this.filters = ['keywords', 'to', 'remove'];

            doc = window.content.document;

            var items = declutterTwitter.jQuery('.stream-item',doc);
            declutterTwitter.jQuery.each(items, function(i, v)
                {
                    declutterTwitter.jQuery.each(declutterTwitter.filters, function(n, word)
                    {
                        if(declutterTwitter.jQuery(v, doc).html().toLowerCase().indexOf( word.toLowerCase() ) > -1)
                        {
                            declutterTwitter.jQuery(v, doc).remove();
                        }
                    });
                });
        },

        run : function () {

            this.removeTweets();

            window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr.streams.Stream.methods(
            { _renderItemHtml: function (A)
                {
                    declutterTwitter.removeTweets();
                    var items = declutterTwitter.jQuery('.stream-items');
                    declutterTwitter.jQuery.each(items, function()
                    {
                        var c = declutterTwitter.jQuery(this).html();

                        var p = declutterTwitter.jQuery(this);
                        declutterTwitter.jQuery.each(declutterTwitter.filters, function(i, v)
                        {
                            if(c.toLowerCase().indexOf(v) > 0)
                            {
                                p.remove();
                            }
                        });
                    });

                    var fclean = true;
                    declutterTwitter.jQuery.each(declutterTwitter.filters, function(i, v)
                    {
                        var chk = A.text + A.source;
                        if(chk.toLowerCase().indexOf(v) > 0)
                        {
                            fclean = false;
                        }
                    });
                    if(!fclean)
                    {
                        return '';
                    }
                    this.itemIds = this.itemIds || {};
                    var B = this.streamItemId ? this.streamItemId(A) : A.id;this.itemIds[B] = 1;
                    A.query = this.params.query;
                    if (A.attributes)
                    {
                        A.attributes.query = this.params.query
                    }

                    // @TODO: Accessing constructor without subclassing (StreamTweet), not liked by firefox
                    var si = window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr;
                    var st = new si.views.StreamItem(A);

                    return new twttr.views.StreamItem(
                        {
                            item_html: st.html(),item_id: B,item_type: this.streamItemType
                        }
                    ).html();
                }
            });
        }
    };
}();

/**
 * This handy number lets us get a usable DOM from a full html page (aHTMLString)
 */
function HTMLParser(aHTMLString)
{
    var html = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
    body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
    html.documentElement.appendChild(body);

    body.appendChild(Components.classes["@mozilla.org/feed-unescapehtml;1"]
        .getService(Components.interfaces.nsIScriptableUnescapeHTML)
        .parseFragment(aHTMLString, false, null, body));

    return body;
}

window.addEventListener("load", declutterTwitter.init, false);