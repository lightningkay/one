/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

/* ---------------- SecurityGroup tab plugin ---------------- */


//Prepares the dialog to create
function setupCreateSecurityGroupDialog(){
    if ($('#create_security_group_dialog').length == 0) {
        dialogs_context.append('<div id="create_security_group_dialog"></div>');
    }

    $create_security_group_dialog = $('#create_security_group_dialog',dialogs_context);
    var dialog = $create_security_group_dialog;

    dialog.html(create_security_group_tmpl);
    dialog.addClass("reveal-modal").attr("data-reveal", "");

    $('#create_security_group_form',dialog).submit(function(){
        var name=$('#security_groupname',this).val();
        var security_group_json = { "security_group" : { "name" : name}};
        Sunstone.runAction("SecurityGroup.create",security_group_json);
        return false;
    });

}

function popUpCreateSecurityGroupDialog(){
    $create_security_group_dialog.foundation().foundation('reveal', 'open');
    $("input#name",$create_security_group_dialog).focus();
    return false;
}

// Security Group clone dialog
function setupSecurityGroupCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="security_group_clone_dialog""></div>');
    var dialog = $('#security_group_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<div class="row">\
        <h3 class="subheader">'+tr("Clone Security Group")+'</h3>\
      </div>\
      <form>\
      <div class="row">\
        <div class="large-12 columns">\
          <div class="clone_one"></div>\
          <div class="clone_several">'+tr("Several security groups are selected, please choose a prefix to name the new copies")+'<br></div>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
          <label class="clone_one">'+tr("Name")+'</label>\
          <label class="clone_several">'+tr("Prefix")+'</label>\
          <input type="text" name="name"></input>\
        </div>\
      </div>\
      <div class="form_buttons row">\
        <button class="button radius right" id="security_group_clone_button" value="SecurityGroup.clone">\
      '+tr("Clone")+'\
        </button>\
              </div>\
      <a class="close-reveal-modal">&#215;</a>\
      </form>\
      ';


    dialog.html(html);
    dialog.addClass("reveal-modal").attr("data-reveal", "");

    $('form',dialog).submit(function(){
        var name = $('input', this).val();
        var sel_elems = securityGroupElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //use name as prefix if several items selected
                Sunstone.runAction('SecurityGroup.clone',
                                   sel_elems[i],
                                   name+getSecurityGroupName(sel_elems[i]));
        } else {
            Sunstone.runAction('SecurityGroup.clone',sel_elems[0],name)
        };
        $(this).parents('#security_group_clone_dialog').foundation('reveal', 'close')
        setTimeout(function(){
            Sunstone.runAction('SecurityGroup.refresh');
        }, 1500);
        return false;
    });
}

function popUpSecurityGroupCloneDialog(){
    var dialog = $('#security_group_clone_dialog');
    var sel_elems = securityGroupElements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1){
        $('.clone_one',dialog).hide();
        $('.clone_several',dialog).show();
        $('input',dialog).val('Copy of ');
    }
    else {
        $('.clone_one',dialog).show();
        $('.clone_several',dialog).hide();
        $('input',dialog).val('Copy of '+getSecurityGroupName(sel_elems[0]));
    };

    $(dialog).foundation().foundation('reveal', 'open');
    $("input[name='name']",dialog).focus();
}


var create_security_group_tmpl =
'<div class="row">\
  <div class="large-12 columns">\
    <h3 id="create_security_group_header" class="subheader">'+tr("Create Security Group")+'</h3>\
  </div>\
</div>\
<form id="create_security_group_form" action="">\
  <div class="row">\
    <div class="large-12 columns">\
      <label for="security_groupname">'+tr("Security Group Name")+':</label>\
      <input type="text" name="security_groupname" id="security_groupname" />\
    </div>\
  </div>\
  <div class="form_buttons">\
      <button class="button radius right success" id="create_security_group_submit" value="security_group/create">'+tr("Create")+'</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var dataTable_security_groups;
var $create_security_group_dialog;

//Setup actions
var security_group_actions = {

    "SecurityGroup.create" : {
        type: "create",
        call: OpenNebula.SecurityGroup.create,
        callback: function(request, response){
            $create_security_group_dialog.foundation('reveal', 'close');
            $("form", $create_security_group_dialog)[0].reset();

            Sunstone.runAction('SecurityGroup.list');
        },
        error: onError,
        notify: true
    },

    "SecurityGroup.create_dialog" : {
        type: "custom",
        call: popUpCreateSecurityGroupDialog
    },

    "SecurityGroup.list" : {
        type: "list",
        call: OpenNebula.SecurityGroup.list,
        callback: updateSecurityGroupsView,
        error: onError
    },

    "SecurityGroup.show" : {
        type: "single",
        call: OpenNebula.SecurityGroup.show,
        callback: function(request, response){
            var tab = dataTable_security_groups.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateSecurityGroupInfo(request, response);
            }

            // datatable row
            updateSecurityGroupElement(request, response);
        },
        error: onError
    },

    "SecurityGroup.show_to_update" : {
        type: "single",
        call: OpenNebula.SecurityGroup.show,
        callback: fillPopPup,
        error: onError
    },

    "SecurityGroup.refresh" : {
        type: "custom",
        call: function(){
          var tab = dataTable_security_groups.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("SecurityGroup.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_security_groups);
            Sunstone.runAction("SecurityGroup.list", {force: true});
          }
        },
        error: onError
    },

    "SecurityGroup.delete" : {
        type: "multiple",
        call : OpenNebula.SecurityGroup.del,
        callback : deleteSecurityGroupElement,
        elements: securityGroupElements,
        error : onError,
        notify:true
    },

    "SecurityGroup.update_template" : {  // Update template
        type: "single",
        call: OpenNebula.SecurityGroup.update,
        callback: function(request,response){
           Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
        },
        error: onError
    },

    "SecurityGroup.chown" : {
        type: "multiple",
        call: OpenNebula.SecurityGroup.chown,
        callback: function(req) {
          Sunstone.runAction("SecurityGroup.show",req.request.data[0]);
        },
        elements: securityGroupElements,
        error:onError
    },

    "SecurityGroup.chgrp" : {
        type: "multiple",
        call: OpenNebula.SecurityGroup.chgrp,
        callback: function(req) {
          Sunstone.runAction("SecurityGroup.show",req.request.data[0]);
        },
        elements: securityGroupElements,
        error:onError
    },

    "SecurityGroup.chmod" : {
        type: "single",
        call: OpenNebula.SecurityGroup.chmod,
        callback: function(req) {
          Sunstone.runAction("SecurityGroup.show",req.request.data[0][0]);
        },
        error: onError
    },

    "SecurityGroup.clone_dialog" : {
        type: "custom",
        call: popUpSecurityGroupCloneDialog
    },

    "SecurityGroup.clone" : {
        type: "single",
        call: OpenNebula.SecurityGroup.clone,
        error: onError,
        notify: true
    },

    "SecurityGroup.rename" : {
        type: "single",
        call: OpenNebula.SecurityGroup.rename,
        callback: function(request) {
            notifyMessage(tr("Security Group renamed correctly"));
            Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
        },
        error: onError,
        notify: true
    }
};

var security_group_buttons = {
    "SecurityGroup.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "SecurityGroup.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },

    "SecurityGroup.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: "User",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "SecurityGroup.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: "Group",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "SecurityGroup.clone_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Clone")
    },
    "SecurityGroup.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
};

var security_groups_tab = {
    title: tr("Security Groups"),
    resource: 'SecurityGroup',
    buttons: security_group_buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    search_input: '<input id="security_group_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-files-o"></i>&emsp;'+tr("Security Groups"),
    info_header: '<i class="fa fa-fw fa-files-o"></i>&emsp;'+tr("Security Group"),
    subheader: '<span/> <small></small>&emsp;',
    table: '<table id="datatable_security_groups" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>' + tr("ID")   + '</th>\
          <th>' + tr("Owner")+ '</th>\
          <th>' + tr("Group")+ '</th>\
          <th>' + tr("Name") + '</th>\
        </tr>\
      </thead>\
      <tbody id="tbodysecurity_groups">\
      </tbody>\
    </table>'
};

var security_group_info_panel = {
    "security_group_info_tab" : {
        title: tr("Security Group information"),
        content:""
    }
};

Sunstone.addActions(security_group_actions);
Sunstone.addMainTab('secgroups-tab',security_groups_tab);
Sunstone.addInfoPanel("security_group_info_panel",security_group_info_panel);

//return lists of selected elements in security_group list
function securityGroupElements(){
    return getSelectedNodes(dataTable_security_groups);
}

function security_groupElementArray(element_json){

    var element = element_json.SECURITY_GROUP;

    return [
        '<input class="check_item" type="checkbox" id="security_group_'+element.ID+'" name="selected_items" value="'+element.ID+'"/>',
        element.ID,
        element.UNAME,
        element.GNAME,
        element.NAME
    ];
}

//callback for an action affecting a security_group element
function updateSecurityGroupElement(request, element_json){
    var id = element_json.SECURITY_GROUP.ID;
    var element = security_groupElementArray(element_json);
    updateSingleElement(element,dataTable_security_groups,'#security_group_'+id);
}

//callback for actions deleting a security_group element
function deleteSecurityGroupElement(req){
    deleteElement(dataTable_security_groups,'#security_group_'+req.request.data);
    $('div#security_group_tab_'+req.request.data,main_tabs_context).remove();
}

//call back for actions creating a security_group element
function addSecurityGroupElement(request,element_json){
    var id = element_json.SECURITY_GROUP.ID;
    var element = security_groupElementArray(element_json);
    addElement(element,dataTable_security_groups);
}

//callback to update the list of security_groups.
function updateSecurityGroupsView (request,list){
    var list_array = [];

    $.each(list,function(){
        //Grab table data from the list
        list_array.push(security_groupElementArray(this));
    });

    updateView(list_array,dataTable_security_groups);
};


// Updates the security_group info panel tab content and pops it up
function updateSecurityGroupInfo(request,security_group){
    security_group_info     = security_group.SECURITY_GROUP;
    security_group_template = security_group_info.TEMPLATE;

    //Information tab
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content :
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_security_group_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">' + tr("Information") +'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td" colspan="2">'+security_group_info.ID+'</td>\
            </tr>'+
            insert_rename_tr(
                'secgroups-tab',
                "SecurityGroup",
                security_group_info.ID,
                security_group_info.NAME)+
            '</tbody>\
         </table>\
        </div>\
        <div class="large-6 columns">' +
            insert_permissions_table('secgroups-tab',
                                       "SecurityGroup",
                                       security_group_info.ID,
                                       security_group_info.UNAME,
                                       security_group_info.GNAME,
                                       security_group_info.UID,
                                       security_group_info.GID) +
        '</div>\
        </div>\
        <div class="row">\
          <div class="large-9 columns">'
                  + insert_extended_template_table(security_group_template,
                                           "SecurityGroup",
                                           security_group_info.ID,
                                           "Attributes") +
         '</div>\
        </div>'
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("security_group_info_panel","security_group_info_tab",info_tab);

    Sunstone.popUpInfoPanel("security_group_info_panel", "secgroups-tab");

    setPermissionsTable(security_group_info,'');
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the security_group datatable, preload it
//and add specific listeners
$(document).ready(function(){
    var tab_name = "secgroups-tab"

    if (Config.isTabEnabled(tab_name)) {
      //prepare security_group datatable
      dataTable_security_groups = $("#datatable_security_groups",main_tabs_context).dataTable({
          "bSortClasses": false,
          "bDeferRender": true,
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#security_group_search').keyup(function(){
        dataTable_security_groups.fnFilter( $(this).val() );
      })

      dataTable_security_groups.on('draw', function(){
        recountCheckboxes(dataTable_security_groups);
      })

      Sunstone.runAction("SecurityGroup.list");

      setupCreateSecurityGroupDialog();
      setupSecurityGroupCloneDialog();

      dialogs_context.append('<div id="create_security_group_dialog"></div>');

      initCheckAllBoxes(dataTable_security_groups);
      tableCheckboxesListener(dataTable_security_groups);
      infoListener(dataTable_security_groups, "SecurityGroup.show");
      dataTable_security_groups.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});