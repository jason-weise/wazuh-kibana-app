/*
 * Wazuh app - Agent vulnerabilities table component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  updateFilters,
  updateIsProcessing,
  updateShowModal,
  updateDefaultItems,
  updateListContent,
  updateFileContent,
  updateListItemsForRemove,
  updateRuleInfo,
  updateDecoderInfo,
} from '../../../../../../redux/actions/rulesetActions';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { formatUIDate } from '../../../../../../react-services/time-service';
import { RulesetHandler, RulesetResources, resourceDictionary } from '../utils/ruleset-handler';
import RulesetColums from './columns';
import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import actionButtons from './actions-buttons'

import {
  rulesItems,
  rulesFiles,
  decodersItems,
  apiSuggestsItems,
  buttonOptions
} from './ruleset-suggestions';

export const RulesetTable = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const rulesetHandler = new RulesetHandler(props.state.section);
 
  const getColumns = () => {
    const { section, showingFiles } = props.state;
    const rulesetColums = new RulesetColums(props).columns;
    const columns = showingFiles ? rulesetColums.files : rulesetColums[section];
    return columns;
  }

  const getRowProps = (item) => {
    const { id, name } = item;

    const getRequiredPermissions = (item) => {
      const { section } = props.state;
      const { permissionResource } = resourceDictionary[section];
      return [
        {
          action: `${section}:read`,
          resource: permissionResource(item.name),
        },
      ];
    };

    const updateInfo = async () => {
      if (isLoading) return;
      setIsLoading(true);
      const { section } = props.state;
      section === RulesetResources.RULES && (window.location.href = `${window.location.href}&redirectRule=${id}`);
      try {
        if (section === RulesetResources.LISTS) {
          const result = await rulesetHandler.getFileContent(item.filename);
          const file = {
            name: item.filename,
            content: result,
            path: item.relative_dirname,
          };
          props.updateListContent(file);
        } else {
          const result = await rulesetHandler.getResource({
            params: {
              filename: item.filename,
            },
          });
          if (result.data) {
            Object.assign(result.data, { current: id || name });
          }
          if (section === RulesetResources.RULES) props.updateRuleInfo(result.data);
          if (section === RulesetResources.DECODERS) props.updateDecoderInfo(result.data);
        }
      } catch (error) {
        const options = {
          context: `${RulesetTable.name}.updateInfo`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: `Error updating info: ${error.message || error}`,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
        setIsLoading(false);
      }
      setIsLoading(false);
    };

    return {
      'data-test-subj': `row-${id || name}`,
      className: 'customRowClass',
      onClick: !WzUserPermissions.checkMissingUserPermissions(
        getRequiredPermissions(item),
        props.userPermissions
      )
        ? updateInfo
        : undefined,
    };
  };


  const { filters } = props.state;
  const { updateFilters } = props;
  const columns = getColumns();
  
  return (
    <div className="wz-inventory">
      <TableWzAPI
        actionButtons={actionButtons}
        title={'Rules'}
        description={'From here you can manage your rules.'}
        tableColumns={columns}
        tableInitialSortingField="id"
        searchTable={true}
        searchBarSuggestions={apiSuggestsItems.items.rules}
        endpoint={'/rules'}
        isExpandable={true}
        rowProps={getRowProps}
        downloadCsv={true}
        filters={filters}
        onFiltersChange={updateFilters}
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );

}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateFilters: filters => dispatch(updateFilters(filters)),
    updateIsProcessing: state => dispatch(updateIsProcessing(state)),
    updateShowModal: (showModal) => dispatch(updateShowModal(showModal)),
    updateFileContent: (fileContent) => dispatch(updateFileContent(fileContent)),
    updateListContent: (listInfo) => dispatch(updateListContent(listInfo)),
    updateListItemsForRemove: (itemList) => dispatch(updateListItemsForRemove(itemList)),
    updateRuleInfo: (rule) => dispatch(updateRuleInfo(rule)),
    updateDecoderInfo: (rule) => dispatch(updateDecoderInfo(rule)),
  };
};

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withUserPermissions
  )(RulesetTable);