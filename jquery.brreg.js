/*!
 * jQuery Plugin: bbreg Plugin (Norwegian Company lookups)
 * https://github.com/gitleif/brregPlugin/
 *
 * Copyright (c) 2018-2020, Leif Nesheim and Systemsmia DA http://www.systemsmia.no/
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Usage:
 *  getCompanies(request, callback) -> Returns to callback all companys matching request
 *  getCompany(organizationid, callback) -> Get all registered information about one single company, defined by organizationid
 *  getCompanyEHF(organizationid, callback) -> Get EHF information about one single comapny, defined by organizationid
 *
 *  
 * Author:  leifnesheim@hotmail.com
 * Version: 1.0
 * Date: 02/11/2018
 */

// Create an immediately invoked functional expression to wrap our code
(function()
 {
  // Added 24042020 -> IE->if StartsWith not exist
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    };
  }


  // Define our constructor
  this.brregPlugin = function()
  {

    // Define option defaults
    //filter:"startswith(navn,'%req%')"
    var defaults = {
      size: 30,
      filter:"%req%"
    };

    // Create options by extending defaults with the passed in arugments
    if (typeof arguments[0] !== 'undefined')
    {
      if (arguments[0] && typeof arguments[0] === "object") {
        this.options = extendDefaults(defaults, arguments[0]);
      }
    }
    else
    {
      this.options = defaults;
    }
    
    // This returns all companies matching the filter to the callback func
    this.getCompanies = function(request, callback)
    {
          var $filter = ("?navn=" + this.options.filter.replace("%req%", encodeURIComponent(request)) + "&size=" +this.options.size);
          var obj = $.getJSON( "https://data.brreg.no/enhetsregisteret/api/enheter" + $filter,
                              
          function(jsonres)
          {
            
               var ret = [];                    
               if(typeof jsonres._embedded !== 'undefined')
               {
                    for (var i = 0; i <  jsonres._embedded.enheter.length; i++)
                    {
                        var enhet = jsonres._embedded.enheter[i];                        
                         if(enhet.underAvvikling==false && enhet.navn.startsWith(request.toUpperCase())) // Slik at ein kun får opp firma som er aktive
                         {
                              ret.push({"label":fixPublisherName(enhet.navn), "id":enhet.organisasjonsnummer});
                         }
                    }
               }
               callback(ret);
          });
    }
    
    // This returns all the available company data from brreg about the
    // requested company.
    this.getCompany = function(organizationID, callback)
    {
        var obj = $.getJSON( "https://data.brreg.no/enhetsregisteret/api/enheter/" + encodeURIComponent(organizationID),
        function(jsonres)
        {
            if(jsonres!=null || jsonres!=="undefined")
            {
                // Change the uppertext style
                jsonres.navn = fixPublisherName(jsonres.navn);
                 if(jsonres.forretningsadresse===null || jsonres.forretningsadresse==="undefined")
                 {
                    // Init som data if it does not exist
                    jsonres.forretningsadresse = {adresse:null,kommune:null, kommunenummer:null, land:null, landkode:null,postnummer:null, poststed:null}
                  }
                  callback(jsonres)
              }
              else
              {
                callback(null)
              }        
        });      
    }
    
    this.getCompanyEHF =  function(organizationID, callback)
    {
        if(organizationID.toString().length==9 && isNaN(parseFloat(organizationID))==false)
        {
          //$.getJSON('https://hotell.difi.no/api/json/difi/elma/capabilities?query=' + encodeURIComponent(organizationID),                                                          
            $.getJSON('https://hotell.difi.no/api/json/difi/elma/participants?PEPPOLBIS_3_0_BILLING_01_UBL=Ja&query=' + encodeURIComponent(organizationID),
            function(jsonres)
            {
                  // Std settings
                  callback((extendDefaults({ehf_invoice_2:false,ehf_creditnote_2:false}, jsonres.entries[0])));                       
                return true;
            });
        };
        
    }

  }
    
    // Utility method to extend defaults with user options
    function extendDefaults(source, properties) {
      var property;
      for (property in properties) {
        if (properties.hasOwnProperty(property)) {
          source[property] = properties[property];
        }
      }
      return source;
    }
  
    function capitalizeFirstLetter(string)
    {               
         return(string.toLowerCase().split(' ').map(function(s){ return s.charAt(0).toUpperCase() + s.substring(1)}).join(' '));
    }
          
    function fixPublisherName(string)
    {
        return(decodeURI(capitalizeFirstLetter(string)));
    }
    
    
}());
