$(function() {
   //$.ajax({
   //   url:     "/cgi-bin/sb/survey.pl",
   //   type:    'GET',
   //   success: function(data){$("#survey-index").html(data)}
   //});
   //$("#survey-index").on("click", "button", function(){
   //   console.log($(this).data("id"));
   //})
   $("#survey-index").on("click", "button", DeleteEntry);
   LoadIndex();
});

function LoadIndex() {
   $.ajax({url: "/cgi-bin/sb/survey.pl", type: "GET"})
   .done(function(data){$("#survey-index").html(data)})
   .fail(function(err){alert(err)});
}

function DeleteEntry() {
   var id = $(this).data("id");
   $.ajax({url: "/cgi-bin/sb/survey.pl?id="+id, type: "DELETE"})
   .done(LoadIndex)
   .fail(function(err){alert(err)});
}
