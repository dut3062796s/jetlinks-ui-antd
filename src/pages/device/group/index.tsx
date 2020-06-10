import {PageHeaderWrapper} from '@ant-design/pro-layout';
import React, {useEffect, useState} from 'react';
import {Avatar, Badge, Button, Card, Form, Icon, Input, List, message, Popconfirm, Row, Spin, Tooltip,} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import styles from './index.less';
import {Dispatch} from '@/models/connect';
import apis from '@/services';
import encodeQueryParam from '@/utils/encodeParam';
import LineWrap from "@/pages/device/gateway/LineWrap";
import Save from "@/pages/device/group/save/groupSave";
import device from "@/pages/device/gateway/img/device.svg";
import ChartCard from "@/pages/analysis/components/Charts/ChartCard";
import GroupOnDeviceInfo from "@/pages/device/group/info";

interface Props extends FormComponentProps {
  dispatch: Dispatch;
  deviceGateway: any;
  loading: boolean;
}

interface State {
  spinning: boolean;
  hasMore: boolean,
  searchParam: any,
  deviceGroup: any,
  groupData: any,
  groupDeviceId: string,
}

const DeviceGroup: React.FC<Props> = props => {
  const initState: State = {
    spinning: false,
    hasMore: true,
    searchParam: {pageSize: 8},
    deviceGroup: {},
    groupData: {},
    groupDeviceId: "",
  };

  const [searchParam, setSearchParam] = useState(initState.searchParam);
  const [saveVisible, setSaveVisible] = useState(false);
  const [spinning, setSpinning] = useState(initState.spinning);
  const [deviceGroup, setDeviceGroup] = useState(initState.deviceGroup);
  const [groupData, setGroupData] = useState(initState.groupData);
  const [groupDeviceId, setGroupDeviceId] = useState(initState.groupDeviceId);
  const [deviceInfo, setDeviceInfo] = useState(false);

  const handleSearch = (params?: any) => {
    setSearchParam(params);
    apis.deviceGroup.list(encodeQueryParam(params))
      .then((response: any) => {
        if (response.status === 200) {
          setDeviceGroup(response.result);
        }
        setSpinning(false);
      })
      .catch();
  };

  useEffect(() => {
    setSpinning(true);
    handleSearch(searchParam);
  }, []);

  const statusMap = new Map();
  statusMap.set('在线', 'success');
  statusMap.set('离线', 'error');
  statusMap.set('未激活', 'processing');

  const groupUnBind = (id: string, deviceId: string) => {
    setSpinning(true);
    let list: any[] = [];
    list.push(deviceId);
    apis.deviceGroup._unbind(id, list)
      .then(response => {
        if (response.status === 200) {
          message.success('解绑成功');
          handleSearch(searchParam);
        } else {
          setSpinning(false);
        }
      }).catch(() => {
    });
  };

  const groupRemove = (id: string) => {
    setSpinning(true);
    apis.deviceGroup.remove(id)
      .then((response: any) => {
        if (response.status === 200) {
          message.success('删除成功');
          handleSearch(searchParam);
        } else {
          setSpinning(false);
        }
      })
      .catch(() => {
      })
  };

  const _unbindAll = (groupId: string) => {
    setSpinning(true);
    apis.deviceGroup._unbindAll(groupId)
      .then((response: any) => {
        if (response.status === 200) {
          message.success('删除成功');
          handleSearch(searchParam);
        } else {
          setSpinning(false);
        }
      })
      .catch(() => {
      })
  };

  const onSearch = (name?: string) => {
    setSpinning(true);
    handleSearch({terms: {name$LIKE: name}, pageSize: 8});
  };

  const onChange = (page: number, pageSize: number) => {
    handleSearch({
      pageIndex: page - 1,
      pageSize,
      terms: searchParam.terms,
    });
  };

  const onShowSizeChange = (current: number, size: number) => {
    handleSearch({
      pageIndex: current - 1,
      pageSize: size,
      terms: searchParam.terms,
    });
  };

  return (
    <PageHeaderWrapper title="设备分组管理">
      <div className={styles.filterCardList}>
        <Card bordered={false}>
          <Row>
            <Button type="primary" style={{marginLeft: 8}} onClick={() => {
              setGroupData({});
              setSaveVisible(true)
            }}>
              <Icon type="plus"/>
              新建分组
            </Button>
            <span style={{marginLeft: 20}}>
              <label>分组名称：</label>
              <Input style={{width: '20%'}} placeholder="输入名称后自动查询"
                     onChange={e => {
                       onSearch(e.target.value);
                     }}
              />
            </span>
          </Row>
        </Card>
        <br/>
        <Spin spinning={spinning}>
          {deviceGroup && deviceGroup.pageSize > 0 && (
            <List<any>
              style={{paddingBottom: 20, paddingTop: -10}}
              pagination={{
                current: deviceGroup.pageIndex + 1,
                total: deviceGroup.total,
                pageSize: deviceGroup.pageSize,
                showQuickJumper: true,
                showSizeChanger: true,
                hideOnSinglePage: true,
                pageSizeOptions: ['8', '16', '40', '80'],
                style: {marginTop: -20},
                showTotal: (total: number) =>
                  `共 ${total} 条记录 第  ${deviceGroup.pageIndex + 1}/${Math.ceil(
                    deviceGroup.total / deviceGroup.pageSize,
                  )}页`,
                onChange,
                onShowSizeChange,
              }}
              rowKey="id" grid={{gutter: 24, xl: 4, lg: 3, md: 3, sm: 2, xs: 1}}
              dataSource={deviceGroup.data} className={styles.filterCardList}
              renderItem={item => {
                if (item && item.id) {
                  return (
                    <List.Item key={item.id}>
                      <ChartCard
                        bordered={false} title={item.id}
                        avatar={<Avatar size={40} src={item.avatar}/>}
                        action={
                          <div>
                            <Tooltip key="edit" title="编辑">
                              <Icon
                                type="edit"
                                onClick={() => {
                                  setGroupData(item);
                                  setSaveVisible(true);
                                }}
                              />
                            </Tooltip>
                            <Tooltip key="delete" title="解绑所有设备">
                              <Popconfirm
                                placement="topRight"
                                title="确定该分组解绑所有设备？谨慎操作"
                                onConfirm={() => {
                                  _unbindAll(item.id);
                                }}
                              >
                                <Icon type="disconnect" style={{marginLeft: '15px'}}/>
                              </Popconfirm>
                            </Tooltip>
                            <Tooltip key="delete" title="删除">
                              <Popconfirm
                                placement="topRight"
                                title="确定删除此分组吗？"
                                onConfirm={() => {
                                  groupRemove(item.id);
                                }}
                              >
                                <Icon type="delete" style={{marginLeft: '15px'}}/>
                              </Popconfirm>
                            </Tooltip>
                          </div>
                        }
                        total={() =>
                          <a style={{fontSize: 18}}>
                            <LineWrap title={item.name} height={30}/>
                          </a>
                        }
                      >
                        <div className={styles.StandardTable} style={{paddingTop: 10}}>
                          <List size='small'
                                itemLayout="horizontal" dataSource={item.devices} style={{minHeight: 235}}
                                pagination={{
                                  pageSize: 4,
                                  size: 'small',
                                  hideOnSinglePage: true,
                                }}
                                renderItem={(dev: any) => (
                                  <List.Item
                                    actions={[<Badge status={statusMap.get(dev.state.text)} text={dev.state.text}/>,
                                      <Popconfirm title="确认解绑该设备？" onConfirm={() => {
                                        groupUnBind(item.id, dev.id);
                                      }}>
                                        <a>解绑</a>
                                      </Popconfirm>]}
                                  >
                                    <List.Item.Meta
                                      avatar={<Avatar shape="square" size="small" src={device}/>}
                                      title={<a
                                        onClick={() => {
                                          setDeviceInfo(true);
                                          setGroupDeviceId(dev.id);
                                          // router.push(`/device/instance/save/${dev.id}`);
                                        }}
                                      ><LineWrap title={dev.name} height={20}/></a>}
                                    />
                                  </List.Item>
                                )}
                          />
                        </div>
                      </ChartCard>
                    </List.Item>
                  );
                }
                return ('');
              }}
            />
          )}
        </Spin>
      </div>
      {saveVisible && (
        <Save data={groupData} close={() => {
          handleSearch(searchParam);
          setSaveVisible(false);
        }}/>
      )}
      {deviceInfo && (
        <GroupOnDeviceInfo deviceId={groupDeviceId} close={() => {
          setDeviceInfo(false);
        }}/>
      )}
    </PageHeaderWrapper>
  );
};

export default Form.create<Props>()(DeviceGroup);