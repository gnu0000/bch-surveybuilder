//
// BlockFinder 
//
// This class implements the finder functionality for the surveybuilder and modulebuilder
// This class is managed by the page handler class in pt9.js
//
// options: 
//          inputSel        :  the text input id           "#finderinput"
//          resultsSel      :  the results div id          "#finderresults"
//          imageSel        :  the searching animation id  "#finderimage"
//          searchMinLength:  minimum # of typed characters before searching
//          searchDelay    :  minimum delay between searches
//          searchUrl      :  url to search backend
//          changed        :  callback to indicate changed search results
//
function BlockFinder(options) {
   var self = this;

   this.Init = function(options) {
      self.options         = options || {};
      self.input           = $(options.inputSel       || "#finderinput"  );
      self.results         = $(options.resultsSel     || "#finderresults");
      self.image           = $(options.imageSel       || "#finderimage"  );
      self.searchMinLength = options.searchMinLength  || 0;
      self.searchDelay     = options.searchDelay      || 300;
      self.searchUrl       = options.searchUrl        || "/cgi-bin/sb/module.pl?match=";
      self.searchIndex     = 0;
      self.imageShowCount  = 0;

      self.input.focus(function() {$(this).addClass('focus')   })
                .blur(function()  {$(this).removeClass('focus')})
                .change(self.KeyUp)
                .keyup(self.KeyUp);


      self.HandleSearch("", self.input);
      }
      
   this.KeyUp = function (e) {
      var input = $(this) || "";
      var text = input.val();

      if (text.length >= self.searchMinLength) {
         window.setTimeout(function () {self.HandleSearch(text, input); }, self.searchDelay);
      }
   };

   this.HandleSearch = function (text, input) {
      //console.log("val="+input.val()+" text="+text);
      if (input.val() === text && text !== self.lastSearch) {
         self.lastSearch = text;
         self.Search(text);
      }
   };

   this.Search = function (text) {
      //console.log('searchmodule search fired');
      self.searchIndex++;
      self.ShowSearchImage(1);
      var url = self.searchUrl + text;
      var currentSearchIndex = self.searchIndex;
      $.ajax({
         url:      url,
         type:     'GET',
         success:  function(data){self.Update(data, currentSearchIndex)},
         error:    self.AjaxError,
         complete: self.AjaxComplete
      });
   };

   this.Update = function (data, index) {
      if (index < self.doneSearchIndex) // ignore older search results
         return;
      self.doneSearchIndex = index;
      self.results.empty().html(data);

      if (self.options.changed) { // tell parent class so it can make results draggable
         self.options.changed(self.results);
      }
   };

   this.AjaxError = function(xhr, error) {
      alert ("Finder Ajax Error: " + error);
   };

   this.AjaxComplete = function() {
      self.ShowSearchImage(-1);
   };

   this.ShowSearchImage = function(counter) {
      self.imageShowCount += counter;
      if (self.imageShowCount > 0)
         self.image.removeClass("invisible");
      else
         self.image.addClass("invisible");
   };
   this.Init(options);
}
