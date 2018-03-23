import React from 'react';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import MenuItem from 'material-ui/MenuItem';
import DropDownMenu from 'material-ui/DropDownMenu';
import RaisedButton from 'material-ui/RaisedButton';
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import FlatButton from 'material-ui/FlatButton';
import Toggle from 'material-ui/Toggle';


import FormatBold from 'material-ui/svg-icons/editor/format-bold';
import FormatItalic from 'material-ui/svg-icons/editor/format-italic';
import FormatUnderlined from 'material-ui/svg-icons/editor/format-underlined';

import FormatAlignCenter from 'material-ui/svg-icons/editor/format-align-center';
import FormatAlignLeft from 'material-ui/svg-icons/editor/format-align-left';
import FormatAlignRight from 'material-ui/svg-icons/editor/format-align-right';
import FormatAlignJustify from 'material-ui/svg-icons/editor/format-align-justify';

import Code from 'material-ui/svg-icons/action/code';

import FormatSize from 'material-ui/svg-icons/editor/format-Size';
import FormatColorText from 'material-ui/svg-icons/editor/format-color-text';
import { SketchPicker, GithubPicker } from 'react-color';


import FormatListBulleted from 'material-ui/svg-icons/editor/format-list-bulleted';
import FormatListNumbered from 'material-ui/svg-icons/editor/format-list-Numbered';

import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';

import {Editor, EditorState, RichUtils, Modifier} from 'draft-js';
import ExtendedRichUtils from '../utils/ExtendedRichUtils';

import createStyles from 'draft-js-custom-styles';
import {connect} from 'react-redux';
import getCurrentlySelectedBlock from '../utils/getCurrentlySelectedBlock';


const customStyleMap = {
  MARK: {
    backgroundColor: 'Yellow',
    fontStyle: 'italic'
  }
};

// Passing the customStyleMap is optional
const { styles, customStyleFn, exporter } = createStyles([
  'font-size', 'color', 'font-weight', 'font-style', 'text-decoration', 'text-align', 'width', 'display', 'text-indent'
], 'CUSTOM_', customStyleMap);

export default class Textbar extends React.Component {
  toggleAlignRight = (e) => {
    e.preventDefault();
    const newEditorState = ExtendedRichUtils.toggleAlignment(this.props.editorState, "RIGHT");
    this.handleEditorChange(newEditorState);
  }

  toggleAlignCenter = (e) => {
    e.preventDefault();
    const newEditorState = ExtendedRichUtils.toggleAlignment(this.props.editorState, "CENTER");
    this.handleEditorChange(newEditorState);
  }

  toggleAlignLeft = (e) => {
    e.preventDefault();
    const newEditorState = ExtendedRichUtils.toggleAlignment(this.props.editorState, "LEFT");
    this.handleEditorChange(newEditorState);
  }

  toggleAlignJustify = (e) => {
    e.preventDefault();
    const newEditorState = ExtendedRichUtils.toggleAlignment(this.props.editorState, "JUSTIFY");
    this.handleEditorChange(newEditorState);
  }

  toggleBold = (e) => {
    e.preventDefault();
    const newEditorState = styles.fontWeight.toggle(this.props.editorState, 'bold');
    this.handleEditorChange(newEditorState);
  };

  toggleItalic = (e) => {
    e.preventDefault();
    const newEditorState = styles.fontStyle.toggle(this.props.editorState, 'italic');
    this.handleEditorChange(newEditorState);
  };

  toggleUnderline = (e) => {
    e.preventDefault();
    const newEditorState = styles.textDecoration.toggle(this.props.editorState, 'underline');
    this.handleEditorChange(newEditorState);
  };

  toggleUl = (e) => {
    e.preventDefault();
    const newEditorState = RichUtils.toggleBlockType(this.props.editorState,"unordered-list-item")
    this.handleEditorChange(newEditorState);
  }

  toggleOl = (e) => {
    e.preventDefault();
    const newEditorState = RichUtils.toggleBlockType(this.props.editorState,"ordered-list-item")
    this.handleEditorChange(newEditorState);
  }

  toggleCodeBlock = (e) => {
    e.preventDefault();
    const newEditorState = RichUtils.toggleBlockType(this.props.editorState,"code-block")
    this.handleEditorChange(newEditorState);
  }

  handleEditorChange = (editorState) => {
    // debugger;
    // this.props.
    this.props.updateEditor(editorState);
  }

  handleChangeComplete = (color) => {
    console.log('old: ', this.props.editorState.getCurrentInlineStyle().toJS());
    const newEditorState = styles.color.toggle(this.props.editorState, color.hex);
    console.log('updated: ', newEditorState.getCurrentInlineStyle().toJS());
    this.handleEditorChange(newEditorState);
  };

  handleFontChange = (e, font) => {
    console.log(font)
    const newEditorState = styles.fontSize.toggle(this.props.editorState, font);
    this.handleEditorChange(newEditorState);
  }

  render() {
    //set color toggles for icons
    const styles = this.props.editorState.getCurrentInlineStyle().toJS();
    const {currentBlock} = getCurrentlySelectedBlock(this.props.editorState);
    const blockStyle = currentBlock.toJS().type;
    const textAlign = currentBlock.getData().get("textAlignment") === undefined ?
                      "LEFT" :
                      currentBlock.getData().get("textAlignment");
    return (
      <div style={{
        'position': 'sticky',
        'top': '0px'
      }}>
        <Toolbar style={{'display':'flex', 'alignItems': 'center'}}>
          <FormatBold onMouseDown={this.toggleBold}
                      color={styles.includes("CUSTOM_FONT_WEIGHT_bold") ? 'black' : 'white'}
                    />

          <FormatItalic onMouseDown={this.toggleItalic}
                        color={styles.includes("CUSTOM_FONT_STYLE_italic") ? 'black' : 'white'}
                      />

          <FormatUnderlined onMouseDown={this.toggleUnderline}
                            color={styles.includes("CUSTOM_TEXT_DECORATION_underline") ? 'black' : 'white'}/>

          <Code onMouseDown={this.toggleCodeBlock} color={blockStyle === 'code-block' ? 'black' : 'white'}/>

          <FormatAlignLeft onMouseDown={this.toggleAlignLeft}
                           color={textAlign === 'LEFT' ? 'black' : 'white'}/>

          <FormatAlignCenter onMouseDown={this.toggleAlignCenter}
                             color={textAlign === 'CENTER' ? 'black' : 'white'}/>

          <FormatAlignRight onMouseDown={this.toggleAlignRight}
                            color={textAlign === 'RIGHT' ? 'black' : 'white'}/>

          <FormatAlignJustify onMouseDown={this.toggleAlignJustify}
                              color={textAlign === 'JUSTIFY' ? 'black' : 'white'}/>
          <div onMouseDown={(e) => e.preventDefault()}>
            <IconMenu
              disableAutoFocus={true}
              iconButtonElement={<IconButton><FormatSize color={'white'}/></IconButton>}
              animated={false}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              menuItemStyle={{'fontSize': '12px', 'margin': 0}}
              maxHeight={300}
              onItemClick={this.handleFontChange} >
            <div onMouseDown={(e) => e.preventDefault()}>
                <MenuItem value="8px" primaryText="8" onMouseDown={this.handleFontChange}/>
                <MenuItem value="9px" primaryText="9" />
                <MenuItem value="10px" primaryText="10" />
                <MenuItem value="11px" primaryText="11" />
                <MenuItem value="12px" primaryText="12" />
                <MenuItem value="14px" primaryText="14" />
                <MenuItem value="18px" primaryText="18" />
                <MenuItem value="24px" primaryText="24" />
                <MenuItem value="30px" primaryText="30" />
                <MenuItem value="36px" primaryText="36" />
                <MenuItem value="48px" primaryText="48" />
                <MenuItem value="60px" primaryText="60" />
                <MenuItem value="72px" primaryText="72" />
                <MenuItem value="96px" primaryText="96" />
              </div>
            </IconMenu>
          </div>

          <div onMouseDown={(e) => e.preventDefault()}>
          <IconMenu
            disableAutoFocus={true}
            iconButtonElement={<IconButton><FormatColorText color={'white'}/></IconButton>}
            animated={false}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            >

            <MenuItem
              primaryText={< SketchPicker
                onChangeComplete=
                {this.handleChangeComplete}
              />}
            />

            <MenuItem
              primaryText="Case Tools"
              menuItems={[
                <MenuItem primaryText="UPPERCASE" />,
                <MenuItem primaryText="lowercase" />,
                <MenuItem primaryText="CamelCase" />,
                <MenuItem primaryText="Propercase" />,
              ]}
            />
            {/* <Divider /> */}
            <MenuItem value="Del" primaryText="Customize" />

          </IconMenu>
        </div>

          <FormatListBulleted onMouseDown={this.toggleUl} color={blockStyle === 'unordered-list-item' ? 'black' : 'white'}/>

          <FormatListNumbered onMouseDown={this.toggleOl} color={blockStyle === 'ordered-list-item' ? 'black' : 'white'}/>

        </Toolbar>
      </div>
    );
  }
}
