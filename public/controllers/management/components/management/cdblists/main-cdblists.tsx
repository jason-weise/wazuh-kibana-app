/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
// Redux
import WzReduxProvider from '../../../../../redux/wz-redux-provider';
//Wazuh ruleset tables(rules, decoder, lists)
import WzCDBListsOverview from './views/cdblists-overview';
//Information about CDBList
import WzListEditor from './views/list-editor';

export default class WzRuleset extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listContent: false
    };
  }

  render() {
    const { listContent } = this.state;

    return (
      <WzReduxProvider>
        {
          (listContent && <WzListEditor
            listContent={listContent}
            clusterStatus={this.props.clusterStatus}
            clearContent={() => { this.setState({ listContent: false }) }}
          />) ||
          <WzCDBListsOverview
            clusterStatus={this.props.clusterStatus}
            updateListContent={(listContent) => { this.setState({ listContent }) }}
          />
        }
      </WzReduxProvider>
    );
  }
}
