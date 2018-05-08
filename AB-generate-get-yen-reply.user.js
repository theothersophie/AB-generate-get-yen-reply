// ==UserScript==
// @name        Get yen for raw manga and novels reply generator
// @author      theothersophie
// @include     *animebytes.tv/alltorrents.php?type=uploaded*
// @namespace   https://github.com/theothersophie/AB-generate-get-yen-reply/raw/master/AB-generate-get-yen-reply.user.js
// @downloadURL https://github.com/theothersophie/AB-generate-get-yen-reply/raw/master/AB-generate-get-yen-reply.user.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @version     2018.05.08
// @run-at      document-end
// ==/UserScript==

//jshint esversion: 6

button_html = `<button id="generate_reply" style="float:right;">Generate thread reply</button>`;
$("#content").prepend(button_html);

$("#generate_reply").click(get_torrent_links());

torrentLinks = [];
html_array = [];
output_array = [];

//Create array of all torrent links on the page
function get_torrent_links() {
  $("a").each(function(index) {
    if (this.href.search('torrentid') != -1) {
      torrentLinks.push(this.href);
    }
  });

  var counter = 0;
  url = torrentLinks[counter];
  //wait before every request to avoid hitting rate limit
  var fetch = setInterval(function getData() {
    console.log(url);
    var request = $.ajax({
      url: url,
      dataType: 'html',
      success: function(data) {
        html_array.push(request.responseText);
        if (counter >= torrentLinks.length) {
          window.clearInterval(fetch);
          get_reply();
        }
      }
    });
    counter++;
    url = torrentLinks[counter];
  }, 1000);
}

function get_reply() {
  //parse all the pages
  for (i = 0; i < html_array.length; i++) {
    item = generate_reply(html_array[i]);
    //Add the formatted info to the main array
    output_array.push(item);
  }

  add_dialog_html();
  $(function() {
    $("#dialog textarea").val(output_array.join('\n\n'));
    $("#dialog").dialog({
      modal: true
    });
    $(".ui-dialog").attr("style", `background: #fff;
border: 1px solid;
position: fixed !important;
top: 50% !important;
left: 50% !important;
transform: translate(-50%, -50%);
max-width: 600px;
padding: 15px;`);
  });
}

function add_dialog_html() {
  html = `<div id="dialog" title="Copy the following">
  <textarea style="width: 600px; height: 200px;"></textarea>
</div>`;

  $("body").append(html);
}

function generate_reply(html) {
  //parse it for the volume count, whether it's complete series, whether files are EPUB format
  vol_count = get_vol_count(html);
  is_complete = get_is_complete(html);
  is_digital = get_is_digital(html);
  //Format all the info together
  formatted_item = format_data(url, vol_count, is_complete, is_digital);
  return formatted_item;
}

function get_vol_count(html) {
  return html.match(/<tr>.+?<\/tr>/g).length;
}

function get_is_complete(html) {
  return html.search('edition_info') == -1;
}

function get_is_digital(html) {
  return html.search('EPUB') > -1;
}

function format_data(url, vol_count, is_complete, is_digital) {
  if (is_complete && is_digital) {
    yen = vol_count * 5 + 10;
  } else if (is_complete) {
    yen = vol_count * 3 + 10;
  } else {
    yen = vol_count * 3;
  }

  torrent_line = '[torrent]' + url + '[/torrent]';

  if (vol_count == 1) {
    strVol = " Volume ";
  } else {
    strVol = " Volumes ";
  }

  count_and_yen_line = vol_count.toString() + strVol + '(' + yen.toString() + 'k)';

  return torrent_line + '\n' + count_and_yen_line;
}