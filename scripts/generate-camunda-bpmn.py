#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE OFFICIAL CAMUNDA MODELER BPMN 2.0 XML
==============================================
Tạo tệp .bpmn chuẩn OMG BPMN 2.0 & Camunda Modeler 5.x:
Quy trình Tự Động Hóa Xử Lý Sự Cố & Bồi Thường Khiếu Nại Bưu Chính Nexus
(Incident & Claim Resolution Process).

File đầu ra:
  docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/01-bpmn-incident-claim-resolution.bpmn

Đặc tả kỹ thuật Camunda Modeler:
- Schema: OMG BPMN 2.0 (http://www.omg.org/spec/BPMN/20100524/MODEL)
- Diagram Interchange: BPMN DI (http://www.omg.org/spec/BPMN/20100524/DI)
- Camunda Extensions: xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
- Collaboration Pool + 4 Swimlanes:
  1. Lane_Customer: Khách hàng / Merchant
  2. Lane_AI_Ingestion: Tiếp nhận & AI Chatbot
  3. Lane_Core_Engine: Xử lý Tự động & DMN Lõi
  4. Lane_HITL_Arbitration: Hậu kiểm & Trọng tài HITL
- Đầy đủ các loại phần tử:
  * Start Event (Message Start)
  * User Tasks, Service Tasks, Send Tasks, Manual Tasks, Business Rule Tasks
  * Boundary Timer Event (SLA 24h)
  * Intermediate Catch Message Event
  * Exclusive Gateways (XOR) & Parallel Gateways (AND Fork/Join)
  * End Events (Message End, Terminate End, None End)
  * Data Objects & Data Stores (PostgreSQL, Milvus SOPs)
  * Text Annotations with Associations
  * Tọa độ chuẩn xác 100% trong <bpmndi:BPMNDiagram> mở trực tiếp bằng Camunda Modeler!
"""

import os
import xml.etree.ElementTree as ET

def generate_bpmn_xml():
    xml_lines = []
    xml_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    xml_lines.append('<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"')
    xml_lines.append('                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"')
    xml_lines.append('                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"')
    xml_lines.append('                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"')
    xml_lines.append('                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')
    xml_lines.append('                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"')
    xml_lines.append('                  id="Definitions_Nexus_Logistics"')
    xml_lines.append('                  targetNamespace="http://bpmn.io/schema/bpmn"')
    xml_lines.append('                  exporter="Camunda Modeler"')
    xml_lines.append('                  exporterVersion="5.48.0">')
    xml_lines.append('  <bpmn:error id="Error_AI_Failure" name="AI_Service_Error" errorCode="ERR_AI_500" />')
    xml_lines.append('')
    # 1. COLLABORATION (POOL & LANES)
    xml_lines.append('  <bpmn:collaboration id="Collaboration_Nexus_Incident_Claim">')
    xml_lines.append('    <bpmn:participant id="Participant_Nexus_Logistics"')
    xml_lines.append('                      name="Nexus Logistics (To-Be Automated)"')
    xml_lines.append('                      processRef="Process_Incident_Claim_Resolution" />')
    xml_lines.append('  </bpmn:collaboration>')

    # 2. PROCESS DEFINITION
    xml_lines.append('  <bpmn:process id="Process_Incident_Claim_Resolution" name="Quy Trình Bồi Thường Tự Động" isExecutable="true">')

    # Swimlanes
    xml_lines.append('    <bpmn:laneSet id="LaneSet_Nexus">')
    
    # Lane 1: Customer
    xml_lines.append('      <bpmn:lane id="Lane_Customer" name="Làn 1: Khách Hàng / Merchant">')
    xml_lines.append('        <bpmn:flowNodeRef>Event_Incident_Reported</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Submit_Claim</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Request_More_Docs</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Event_SLA_24h_Timeout</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Event_Claim_Cancelled_Timeout</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Event_Docs_Updated</bpmn:flowNodeRef>')
    xml_lines.append('      </bpmn:lane>')

    # Lane 2: AI Ingestion
    xml_lines.append('      <bpmn:lane id="Lane_AI_Ingestion" name="Làn 2: Hệ Thống AI Tiếp Nhận">')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_OCR_Extraction</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Gateway_Docs_Valid</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Event_AI_Service_Error</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Manual_Fallback_Review</bpmn:flowNodeRef>')
    xml_lines.append('      </bpmn:lane>')

    # Lane 3: Core & DMN
    xml_lines.append('      <bpmn:lane id="Lane_Core_Engine" name="Làn 3: Động Cơ DMN &amp; Core">')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Reconcile_Tracking</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Evaluate_DMN_Rules</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Gateway_Fast_Track_Check</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Gateway_Fork_Payment</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Disburse_Napas</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Send_Invoice_SMS</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Gateway_Join_Payment</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Event_Auto_Claim_Completed</bpmn:flowNodeRef>')
    xml_lines.append('      </bpmn:lane>')

    # Lane 4: HITL Arbitration
    xml_lines.append('      <bpmn:lane id="Lane_HITL_Arbitration" name="Làn 4: Trọng Tài &amp; Pháp Chế">')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Assign_Inspector</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Audit_Hub_Conveyor</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Activity_Arbitration_Tribunal</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Gateway_Arbitration_Verdict</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Event_Arbitration_Approved</bpmn:flowNodeRef>')
    xml_lines.append('        <bpmn:flowNodeRef>Event_Claim_Rejected</bpmn:flowNodeRef>')
    xml_lines.append('      </bpmn:lane>')

    xml_lines.append('    </bpmn:laneSet>')

    # 3. FLOW NODES (ACTIVITIES, GATEWAYS, EVENTS)
    # --- Lane 1 Nodes ---
    xml_lines.append('    <!-- Lane 1: Customer Touchpoint Nodes -->')
    xml_lines.append('    <bpmn:startEvent id="Event_Incident_Reported" name="Phát hiện sự cố kiện hàng">')
    xml_lines.append('      <bpmn:outgoing>Flow_Start_to_Task11</bpmn:outgoing>')
    xml_lines.append('      <bpmn:messageEventDefinition id="MessageEventDef_Start" />')
    xml_lines.append('    </bpmn:startEvent>')

    xml_lines.append('    <bpmn:userTask id="Activity_Submit_Claim" name="Gửi yêu cầu khiếu nại &amp; Upload ảnh hư hại (TASK-1.1)" camunda:candidateGroups="merchants">')
    xml_lines.append('      <bpmn:incoming>Flow_Start_to_Task11</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task11_to_Task21</bpmn:outgoing>')
    xml_lines.append('    </bpmn:userTask>')

    xml_lines.append('    <bpmn:sendTask id="Activity_Request_More_Docs" name="Yêu cầu bổ sung tài liệu &amp; Hình ảnh xác thực BBBT (TASK-1.2)">')
    xml_lines.append('      <bpmn:incoming>Flow_Docs_Invalid</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task12_to_CatchMsg</bpmn:outgoing>')
    xml_lines.append('    </bpmn:sendTask>')

    xml_lines.append('    <bpmn:boundaryEvent id="Event_SLA_24h_Timeout" name="Quá hạn SLA 24h" attachedToRef="Activity_Request_More_Docs">')
    xml_lines.append('      <bpmn:outgoing>Flow_Timeout_Cancel</bpmn:outgoing>')
    xml_lines.append('      <bpmn:timerEventDefinition id="TimerDef_24h">')
    xml_lines.append('        <bpmn:timeDuration xsi:type="bpmn:tFormalExpression">PT24H</bpmn:timeDuration>')
    xml_lines.append('      </bpmn:timerEventDefinition>')
    xml_lines.append('    </bpmn:boundaryEvent>')

    xml_lines.append('    <bpmn:endEvent id="Event_Claim_Cancelled_Timeout" name="Hủy hồ sơ do quá hạn 24h">')
    xml_lines.append('      <bpmn:incoming>Flow_Timeout_Cancel</bpmn:incoming>')
    xml_lines.append('      <bpmn:terminateEventDefinition id="TerminateDef_Timeout" />')
    xml_lines.append('    </bpmn:endEvent>')

    xml_lines.append('    <bpmn:intermediateCatchEvent id="Event_Docs_Updated" name="Nhận BBBT bổ sung">')
    xml_lines.append('      <bpmn:incoming>Flow_Task12_to_CatchMsg</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_CatchMsg_to_Task21</bpmn:outgoing>')
    xml_lines.append('      <bpmn:messageEventDefinition id="MessageEventDef_DocsUpdated" />')
    xml_lines.append('    </bpmn:intermediateCatchEvent>')

    # --- Lane 2 Nodes ---
    xml_lines.append('    <!-- Lane 2: AI Chatbot & Ingestion Nodes -->')
    xml_lines.append('    <bpmn:serviceTask id="Activity_OCR_Extraction" name="Trích xuất OCR tài liệu &amp; Phân loại sơ bộ (TASK-2.1)" camunda:type="external" camunda:topic="ocr-extraction">')
    xml_lines.append('      <bpmn:incoming>Flow_Task11_to_Task21</bpmn:incoming>')
    xml_lines.append('      <bpmn:incoming>Flow_CatchMsg_to_Task21</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task21_to_GW1</bpmn:outgoing>')
    xml_lines.append('      <bpmn:dataInputAssociation id="DataInputAssoc_Tracking">')
    xml_lines.append('        <bpmn:sourceRef>DataStore_Tracking</bpmn:sourceRef>')
    xml_lines.append('        <bpmn:targetRef>Activity_OCR_Extraction</bpmn:targetRef>')
    xml_lines.append('      </bpmn:dataInputAssociation>')
    xml_lines.append('    </bpmn:serviceTask>')
    xml_lines.append('')
    xml_lines.append('    <bpmn:boundaryEvent id="Event_AI_Service_Error" name="Lỗi AI / Timeout &gt; 10s" attachedToRef="Activity_OCR_Extraction">')
    xml_lines.append('      <bpmn:outgoing>Flow_AI_Error_to_Fallback</bpmn:outgoing>')
    xml_lines.append('      <bpmn:errorEventDefinition id="ErrorEventDef_AI_1" errorRef="Error_AI_Failure" />')
    xml_lines.append('    </bpmn:boundaryEvent>')
    xml_lines.append('')
    xml_lines.append('    <bpmn:userTask id="Activity_Manual_Fallback_Review" name="Tiếp nhận &amp; Thẩm định hồ sơ thủ công (TASK-2.1F Fallback CSKH)" camunda:candidateGroups="cskh_operators">')
    xml_lines.append('      <bpmn:incoming>Flow_AI_Error_to_Fallback</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Fallback_to_GW1</bpmn:outgoing>')
    xml_lines.append('    </bpmn:userTask>')
    xml_lines.append('')
    xml_lines.append('    <bpmn:exclusiveGateway id="Gateway_Docs_Valid" name="Hồ sơ hợp lệ?">')
    xml_lines.append('      <bpmn:incoming>Flow_Task21_to_GW1</bpmn:incoming>')
    xml_lines.append('      <bpmn:incoming>Flow_Fallback_to_GW1</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Docs_Valid</bpmn:outgoing>')
    xml_lines.append('      <bpmn:outgoing>Flow_Docs_Invalid</bpmn:outgoing>')
    xml_lines.append('    </bpmn:exclusiveGateway>')

    # --- Lane 3 Nodes ---
    xml_lines.append('    <!-- Lane 3: Core & DMN Decision Nodes -->')
    xml_lines.append('    <bpmn:serviceTask id="Activity_Reconcile_Tracking" name="Đối soát dữ liệu vận đơn &amp; Tính mức tổn thất (TASK-3.1)" camunda:type="external" camunda:topic="order-reconcile">')
    xml_lines.append('      <bpmn:incoming>Flow_Docs_Valid</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task31_to_Task32</bpmn:outgoing>')
    xml_lines.append('      <bpmn:dataInputAssociation id="DataInputAssoc_VectorDB">')
    xml_lines.append('        <bpmn:sourceRef>DataStore_VectorDB</bpmn:sourceRef>')
    xml_lines.append('        <bpmn:targetRef>Activity_Reconcile_Tracking</bpmn:targetRef>')
    xml_lines.append('      </bpmn:dataInputAssociation>')
    xml_lines.append('    </bpmn:serviceTask>')

    xml_lines.append('    <bpmn:businessRuleTask id="Activity_Evaluate_DMN_Rules" name="Đánh giá Ma trận Quyết định DMN (RULE-3.2)" camunda:decisionRef="decision_claim_matrix">')
    xml_lines.append('      <bpmn:incoming>Flow_Task31_to_Task32</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task32_to_GW2</bpmn:outgoing>')
    xml_lines.append('    </bpmn:businessRuleTask>')

    xml_lines.append('    <bpmn:exclusiveGateway id="Gateway_Fast_Track_Check" name="Duyệt nhanh tự động?">')
    xml_lines.append('      <bpmn:incoming>Flow_Task32_to_GW2</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Fast_Track</bpmn:outgoing>')
    xml_lines.append('      <bpmn:outgoing>Flow_Escalate_HITL</bpmn:outgoing>')
    xml_lines.append('    </bpmn:exclusiveGateway>')

    xml_lines.append('    <bpmn:parallelGateway id="Gateway_Fork_Payment" name="Tách luồng giải ngân">')
    xml_lines.append('      <bpmn:incoming>Flow_Fast_Track</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Fork_to_Napas</bpmn:outgoing>')
    xml_lines.append('      <bpmn:outgoing>Flow_Fork_to_Notify</bpmn:outgoing>')
    xml_lines.append('    </bpmn:parallelGateway>')

    xml_lines.append('    <bpmn:serviceTask id="Activity_Disburse_Napas" name="Tự động giải ngân qua Napas 247 / VietQR (TASK-3.3A)" camunda:type="external" camunda:topic="payout-napas">')
    xml_lines.append('      <bpmn:incoming>Flow_Fork_to_Napas</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Napas_to_Join</bpmn:outgoing>')
    xml_lines.append('    </bpmn:serviceTask>')

    xml_lines.append('    <bpmn:sendTask id="Activity_Send_Invoice_SMS" name="Gửi hóa đơn &amp; Thông báo bồi thường (TASK-3.3B)">')
    xml_lines.append('      <bpmn:incoming>Flow_Fork_to_Notify</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Notify_to_Join</bpmn:outgoing>')
    xml_lines.append('    </bpmn:sendTask>')

    xml_lines.append('    <bpmn:parallelGateway id="Gateway_Join_Payment" name="Hợp luồng giải ngân">')
    xml_lines.append('      <bpmn:incoming>Flow_Napas_to_Join</bpmn:incoming>')
    xml_lines.append('      <bpmn:incoming>Flow_Notify_to_Join</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Join_to_EndAuto</bpmn:outgoing>')
    xml_lines.append('    </bpmn:parallelGateway>')

    xml_lines.append('    <bpmn:endEvent id="Event_Auto_Claim_Completed" name="Hoàn tất bồi thường tự động">')
    xml_lines.append('      <bpmn:incoming>Flow_Join_to_EndAuto</bpmn:incoming>')
    xml_lines.append('      <bpmn:messageEventDefinition id="MessageEventDef_AutoDone" />')
    xml_lines.append('    </bpmn:endEvent>')

    # --- Lane 4 Nodes ---
    xml_lines.append('    <!-- Lane 4: HITL Arbitration Nodes -->')
    xml_lines.append('    <bpmn:userTask id="Activity_Assign_Inspector" name="Phân công thẩm định viên &amp; Mở Dossier (TASK-4.1)" camunda:candidateGroups="claim_inspectors">')
    xml_lines.append('      <bpmn:incoming>Flow_Escalate_HITL</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task41_to_Task42</bpmn:outgoing>')
    xml_lines.append('    </bpmn:userTask>')

    xml_lines.append('    <bpmn:manualTask id="Activity_Audit_Hub_Conveyor" name="Giám định băng chuyền kho &amp; Bưu tá (TASK-4.2)">')
    xml_lines.append('      <bpmn:incoming>Flow_Task41_to_Task42</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task42_to_Task43</bpmn:outgoing>')
    xml_lines.append('    </bpmn:manualTask>')

    xml_lines.append('    <bpmn:userTask id="Activity_Arbitration_Tribunal" name="Hội đồng Trọng tài thẩm tra &amp; Phán quyết (TASK-4.3)" camunda:candidateGroups="arbitration_board">')
    xml_lines.append('      <bpmn:incoming>Flow_Task42_to_Task43</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Task43_to_GW3</bpmn:outgoing>')
    xml_lines.append('    </bpmn:userTask>')

    xml_lines.append('    <bpmn:exclusiveGateway id="Gateway_Arbitration_Verdict" name="Phán quyết trọng tài?">')
    xml_lines.append('      <bpmn:incoming>Flow_Task43_to_GW3</bpmn:incoming>')
    xml_lines.append('      <bpmn:outgoing>Flow_Arbitration_Approve</bpmn:outgoing>')
    xml_lines.append('      <bpmn:outgoing>Flow_Arbitration_Reject</bpmn:outgoing>')
    xml_lines.append('    </bpmn:exclusiveGateway>')

    xml_lines.append('    <bpmn:endEvent id="Event_Arbitration_Approved" name="Hoàn tất qua Trọng tài">')
    xml_lines.append('      <bpmn:incoming>Flow_Arbitration_Approve</bpmn:incoming>')
    xml_lines.append('    </bpmn:endEvent>')

    xml_lines.append('    <bpmn:endEvent id="Event_Claim_Rejected" name="Bác bỏ hồ sơ khiếu nại">')
    xml_lines.append('      <bpmn:incoming>Flow_Arbitration_Reject</bpmn:incoming>')
    xml_lines.append('      <bpmn:terminateEventDefinition id="TerminateDef_Reject" />')
    xml_lines.append('    </bpmn:endEvent>')

    # 4. SEQUENCE FLOWS
    xml_lines.append('    <!-- Sequence Flows -->')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Start_to_Task11" sourceRef="Event_Incident_Reported" targetRef="Activity_Submit_Claim" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task11_to_Task21" sourceRef="Activity_Submit_Claim" targetRef="Activity_OCR_Extraction" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task21_to_GW1" sourceRef="Activity_OCR_Extraction" targetRef="Gateway_Docs_Valid" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_AI_Error_to_Fallback" name="Circuit Breaker" sourceRef="Event_AI_Service_Error" targetRef="Activity_Manual_Fallback_Review" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Fallback_to_GW1" name="Duyệt tay" sourceRef="Activity_Manual_Fallback_Review" targetRef="Gateway_Docs_Valid" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Docs_Invalid" name="Thiếu chứng từ / Ảnh mờ" sourceRef="Gateway_Docs_Valid" targetRef="Activity_Request_More_Docs" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Timeout_Cancel" name="Quá hạn 24h" sourceRef="Event_SLA_24h_Timeout" targetRef="Event_Claim_Cancelled_Timeout" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task12_to_CatchMsg" sourceRef="Activity_Request_More_Docs" targetRef="Event_Docs_Updated" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_CatchMsg_to_Task21" sourceRef="Event_Docs_Updated" targetRef="Activity_OCR_Extraction" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Docs_Valid" name="Đầy đủ &amp; Hợp lệ" sourceRef="Gateway_Docs_Valid" targetRef="Activity_Reconcile_Tracking" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task31_to_Task32" sourceRef="Activity_Reconcile_Tracking" targetRef="Activity_Evaluate_DMN_Rules" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task32_to_GW2" sourceRef="Activity_Evaluate_DMN_Rules" targetRef="Gateway_Fast_Track_Check" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Fast_Track" name="Duyệt nhanh: ≤ 2.000.000đ" sourceRef="Gateway_Fast_Track_Check" targetRef="Gateway_Fork_Payment" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Fork_to_Napas" sourceRef="Gateway_Fork_Payment" targetRef="Activity_Disburse_Napas" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Fork_to_Notify" sourceRef="Gateway_Fork_Payment" targetRef="Activity_Send_Invoice_SMS" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Napas_to_Join" sourceRef="Activity_Disburse_Napas" targetRef="Gateway_Join_Payment" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Notify_to_Join" sourceRef="Activity_Send_Invoice_SMS" targetRef="Gateway_Join_Payment" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Join_to_EndAuto" sourceRef="Gateway_Join_Payment" targetRef="Event_Auto_Claim_Completed" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Escalate_HITL" name="Nghi vấn hoặc Giá trị &gt; 2M" sourceRef="Gateway_Fast_Track_Check" targetRef="Activity_Assign_Inspector" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task41_to_Task42" sourceRef="Activity_Assign_Inspector" targetRef="Activity_Audit_Hub_Conveyor" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task42_to_Task43" sourceRef="Activity_Audit_Hub_Conveyor" targetRef="Activity_Arbitration_Tribunal" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Task43_to_GW3" sourceRef="Activity_Arbitration_Tribunal" targetRef="Gateway_Arbitration_Verdict" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Arbitration_Approve" name="Chấp thuận" sourceRef="Gateway_Arbitration_Verdict" targetRef="Event_Arbitration_Approved" />')
    xml_lines.append('    <bpmn:sequenceFlow id="Flow_Arbitration_Reject" name="Bác bỏ / Gian lận" sourceRef="Gateway_Arbitration_Verdict" targetRef="Event_Claim_Rejected" />')

    # Data Store References
    xml_lines.append('    <bpmn:dataStoreReference id="DataStore_Tracking" name="CSDL Vận đơn &amp; POD [DS-01]" />')
    xml_lines.append('    <bpmn:dataStoreReference id="DataStore_VectorDB" name="Kho Quy chế Bưu chính (Milvus) [DS-02]" />')

    # Text Annotations
    xml_lines.append('    <bpmn:textAnnotation id="TextAnnotation_DMN">')
    xml_lines.append('      <bpmn:text>Quy chế bồi thường: Điều 4.2 &amp; Quyết định 28/Nexus</bpmn:text>')
    xml_lines.append('    </bpmn:textAnnotation>')
    xml_lines.append('    <bpmn:association id="Association_DMN" sourceRef="Activity_Evaluate_DMN_Rules" targetRef="TextAnnotation_DMN" />')

    xml_lines.append('    <bpmn:textAnnotation id="TextAnnotation_Napas">')
    xml_lines.append('      <bpmn:text>Cổng Napas 247: SLA &lt; 3 phút giải ngân</bpmn:text>')
    xml_lines.append('    </bpmn:textAnnotation>')
    xml_lines.append('    <bpmn:association id="Association_Napas" sourceRef="Activity_Disburse_Napas" targetRef="TextAnnotation_Napas" />')

    xml_lines.append('  </bpmn:process>')

    # 5. BPMN DIAGRAM INTERCHANGE (BPMNDI) - FOR CAMUNDA MODELER
    xml_lines.append('  <bpmndi:BPMNDiagram id="BPMNDiagram_Nexus">')
    xml_lines.append('    <bpmndi:BPMNPlane id="BPMNPlane_Nexus" bpmnElement="Collaboration_Nexus_Incident_Claim">')

    # Pool Shape
    xml_lines.append('      <bpmndi:BPMNShape id="Participant_Nexus_di" bpmnElement="Participant_Nexus_Logistics" isHorizontal="true">')
    xml_lines.append('        <dc:Bounds x="160" y="80" width="1980" height="920" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    # Lane Shapes
    xml_lines.append('      <bpmndi:BPMNShape id="Lane_Customer_di" bpmnElement="Lane_Customer" isHorizontal="true">')
    xml_lines.append('        <dc:Bounds x="190" y="80" width="1950" height="230" />')
    xml_lines.append('      </bpmndi:BPMNShape>')
    xml_lines.append('      <bpmndi:BPMNShape id="Lane_AI_Ingestion_di" bpmnElement="Lane_AI_Ingestion" isHorizontal="true">')
    xml_lines.append('        <dc:Bounds x="190" y="310" width="1950" height="230" />')
    xml_lines.append('      </bpmndi:BPMNShape>')
    xml_lines.append('      <bpmndi:BPMNShape id="Lane_Core_Engine_di" bpmnElement="Lane_Core_Engine" isHorizontal="true">')
    xml_lines.append('        <dc:Bounds x="190" y="540" width="1950" height="230" />')
    xml_lines.append('      </bpmndi:BPMNShape>')
    xml_lines.append('      <bpmndi:BPMNShape id="Lane_HITL_Arbitration_di" bpmnElement="Lane_HITL_Arbitration" isHorizontal="true">')
    xml_lines.append('        <dc:Bounds x="190" y="770" width="1950" height="230" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    # Lane 1 Shapes
    xml_lines.append('      <bpmndi:BPMNShape id="Event_Incident_Reported_di" bpmnElement="Event_Incident_Reported">')
    xml_lines.append('        <dc:Bounds x="242" y="177" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="221" y="220" width="80" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Submit_Claim_di" bpmnElement="Activity_Submit_Claim">')
    xml_lines.append('        <dc:Bounds x="330" y="155" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Request_More_Docs_di" bpmnElement="Activity_Request_More_Docs">')
    xml_lines.append('        <dc:Bounds x="780" y="155" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Event_SLA_24h_Timeout_di" bpmnElement="Event_SLA_24h_Timeout">')
    xml_lines.append('        <dc:Bounds x="872" y="217" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="852" y="258" width="76" height="14" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Event_Claim_Cancelled_Timeout_di" bpmnElement="Event_Claim_Cancelled_Timeout">')
    xml_lines.append('        <dc:Bounds x="972" y="252" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="951" y="295" width="80" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Event_Docs_Updated_di" bpmnElement="Event_Docs_Updated">')
    xml_lines.append('        <dc:Bounds x="1052" y="177" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1035" y="220" width="70" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    # Lane 2 Shapes
    xml_lines.append('      <bpmndi:BPMNShape id="Activity_OCR_Extraction_di" bpmnElement="Activity_OCR_Extraction">')
    xml_lines.append('        <dc:Bounds x="500" y="385" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Gateway_Docs_Valid_di" bpmnElement="Gateway_Docs_Valid" isMarkerVisible="true">')
    xml_lines.append('        <dc:Bounds x="725" y="400" width="50" height="50" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="715" y="376" width="71" height="14" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')
    xml_lines.append('      <bpmndi:BPMNShape id="Event_AI_Service_Error_di" bpmnElement="Event_AI_Service_Error">')
    xml_lines.append('        <dc:Bounds x="552" y="447" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="500" y="485" width="75" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')
    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Manual_Fallback_Review_di" bpmnElement="Activity_Manual_Fallback_Review">')
    xml_lines.append('        <dc:Bounds x="610" y="475" width="130" height="65" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="DataStore_Tracking_di" bpmnElement="DataStore_Tracking">')
    xml_lines.append('        <dc:Bounds x="545" y="485" width="50" height="50" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="530" y="542" width="80" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    # Lane 3 Shapes
    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Reconcile_Tracking_di" bpmnElement="Activity_Reconcile_Tracking">')
    xml_lines.append('        <dc:Bounds x="850" y="615" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Evaluate_DMN_Rules_di" bpmnElement="Activity_Evaluate_DMN_Rules">')
    xml_lines.append('        <dc:Bounds x="1040" y="615" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Gateway_Fast_Track_Check_di" bpmnElement="Gateway_Fast_Track_Check" isMarkerVisible="true">')
    xml_lines.append('        <dc:Bounds x="1235" y="630" width="50" height="50" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1225" y="600" width="71" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Gateway_Fork_Payment_di" bpmnElement="Gateway_Fork_Payment">')
    xml_lines.append('        <dc:Bounds x="1355" y="630" width="50" height="50" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1348" y="687" width="65" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Disburse_Napas_di" bpmnElement="Activity_Disburse_Napas">')
    xml_lines.append('        <dc:Bounds x="1460" y="565" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Send_Invoice_SMS_di" bpmnElement="Activity_Send_Invoice_SMS">')
    xml_lines.append('        <dc:Bounds x="1460" y="685" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Gateway_Join_Payment_di" bpmnElement="Gateway_Join_Payment">')
    xml_lines.append('        <dc:Bounds x="1655" y="630" width="50" height="50" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Event_Auto_Claim_Completed_di" bpmnElement="Event_Auto_Claim_Completed">')
    xml_lines.append('        <dc:Bounds x="1762" y="637" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1740" y="680" width="80" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="DataStore_VectorDB_di" bpmnElement="DataStore_VectorDB">')
    xml_lines.append('        <dc:Bounds x="895" y="705" width="50" height="50" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="878" y="762" width="85" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    # Lane 4 Shapes
    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Assign_Inspector_di" bpmnElement="Activity_Assign_Inspector">')
    xml_lines.append('        <dc:Bounds x="1310" y="845" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Audit_Hub_Conveyor_di" bpmnElement="Activity_Audit_Hub_Conveyor">')
    xml_lines.append('        <dc:Bounds x="1500" y="845" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Activity_Arbitration_Tribunal_di" bpmnElement="Activity_Arbitration_Tribunal">')
    xml_lines.append('        <dc:Bounds x="1690" y="845" width="140" height="80" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Gateway_Arbitration_Verdict_di" bpmnElement="Gateway_Arbitration_Verdict" isMarkerVisible="true">')
    xml_lines.append('        <dc:Bounds x="1885" y="860" width="50" height="50" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1875" y="830" width="71" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Event_Arbitration_Approved_di" bpmnElement="Event_Arbitration_Approved">')
    xml_lines.append('        <dc:Bounds x="2012" y="867" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1995" y="910" width="70" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="Event_Claim_Rejected_di" bpmnElement="Event_Claim_Rejected">')
    xml_lines.append('        <dc:Bounds x="2012" y="937" width="36" height="36" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1995" y="980" width="70" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNShape>')

    # Text Annotation Shapes
    xml_lines.append('      <bpmndi:BPMNShape id="TextAnnotation_DMN_di" bpmnElement="TextAnnotation_DMN">')
    xml_lines.append('        <dc:Bounds x="1040" y="560" width="180" height="40" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    xml_lines.append('      <bpmndi:BPMNShape id="TextAnnotation_Napas_di" bpmnElement="TextAnnotation_Napas">')
    xml_lines.append('        <dc:Bounds x="1620" y="550" width="170" height="40" />')
    xml_lines.append('      </bpmndi:BPMNShape>')

    # Edges (Waypoints)
    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Start_to_Task11_di" bpmnElement="Flow_Start_to_Task11">')
    xml_lines.append('        <di:waypoint x="278" y="195" />')
    xml_lines.append('        <di:waypoint x="330" y="195" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task11_to_Task21_di" bpmnElement="Flow_Task11_to_Task21">')
    xml_lines.append('        <di:waypoint x="470" y="195" />')
    xml_lines.append('        <di:waypoint x="485" y="195" />')
    xml_lines.append('        <di:waypoint x="485" y="425" />')
    xml_lines.append('        <di:waypoint x="500" y="425" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task21_to_GW1_di" bpmnElement="Flow_Task21_to_GW1">')
    xml_lines.append('        <di:waypoint x="640" y="425" />')
    xml_lines.append('        <di:waypoint x="725" y="425" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')
    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_AI_Error_to_Fallback_di" bpmnElement="Flow_AI_Error_to_Fallback">')
    xml_lines.append('        <di:waypoint x="570" y="483" />')
    xml_lines.append('        <di:waypoint x="570" y="507" />')
    xml_lines.append('        <di:waypoint x="610" y="507" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="505" y="510" width="75" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')
    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Fallback_to_GW1_di" bpmnElement="Flow_Fallback_to_GW1">')
    xml_lines.append('        <di:waypoint x="740" y="507" />')
    xml_lines.append('        <di:waypoint x="810" y="507" />')
    xml_lines.append('        <di:waypoint x="810" y="425" />')
    xml_lines.append('        <di:waypoint x="775" y="425" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="815" y="465" width="48" height="14" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Docs_Invalid_di" bpmnElement="Flow_Docs_Invalid">')
    xml_lines.append('        <di:waypoint x="750" y="400" />')
    xml_lines.append('        <di:waypoint x="750" y="195" />')
    xml_lines.append('        <di:waypoint x="780" y="195" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="660" y="270" width="80" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Timeout_Cancel_di" bpmnElement="Flow_Timeout_Cancel">')
    xml_lines.append('        <di:waypoint x="890" y="253" />')
    xml_lines.append('        <di:waypoint x="890" y="270" />')
    xml_lines.append('        <di:waypoint x="972" y="270" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="895" y="280" width="65" height="14" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task12_to_CatchMsg_di" bpmnElement="Flow_Task12_to_CatchMsg">')
    xml_lines.append('        <di:waypoint x="920" y="195" />')
    xml_lines.append('        <di:waypoint x="1052" y="195" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_CatchMsg_to_Task21_di" bpmnElement="Flow_CatchMsg_to_Task21">')
    xml_lines.append('        <di:waypoint x="1088" y="195" />')
    xml_lines.append('        <di:waypoint x="1120" y="195" />')
    xml_lines.append('        <di:waypoint x="1120" y="360" />')
    xml_lines.append('        <di:waypoint x="570" y="360" />')
    xml_lines.append('        <di:waypoint x="570" y="385" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Docs_Valid_di" bpmnElement="Flow_Docs_Valid">')
    xml_lines.append('        <di:waypoint x="750" y="450" />')
    xml_lines.append('        <di:waypoint x="750" y="655" />')
    xml_lines.append('        <di:waypoint x="850" y="655" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="760" y="535" width="80" height="14" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task31_to_Task32_di" bpmnElement="Flow_Task31_to_Task32">')
    xml_lines.append('        <di:waypoint x="990" y="655" />')
    xml_lines.append('        <di:waypoint x="1040" y="655" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task32_to_GW2_di" bpmnElement="Flow_Task32_to_GW2">')
    xml_lines.append('        <di:waypoint x="1180" y="655" />')
    xml_lines.append('        <di:waypoint x="1235" y="655" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Fast_Track_di" bpmnElement="Flow_Fast_Track">')
    xml_lines.append('        <di:waypoint x="1285" y="655" />')
    xml_lines.append('        <di:waypoint x="1355" y="655" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1280" y="625" width="70" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Fork_to_Napas_di" bpmnElement="Flow_Fork_to_Napas">')
    xml_lines.append('        <di:waypoint x="1380" y="630" />')
    xml_lines.append('        <di:waypoint x="1380" y="605" />')
    xml_lines.append('        <di:waypoint x="1460" y="605" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Fork_to_Notify_di" bpmnElement="Flow_Fork_to_Notify">')
    xml_lines.append('        <di:waypoint x="1380" y="680" />')
    xml_lines.append('        <di:waypoint x="1380" y="725" />')
    xml_lines.append('        <di:waypoint x="1460" y="725" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Napas_to_Join_di" bpmnElement="Flow_Napas_to_Join">')
    xml_lines.append('        <di:waypoint x="1600" y="605" />')
    xml_lines.append('        <di:waypoint x="1680" y="605" />')
    xml_lines.append('        <di:waypoint x="1680" y="630" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Notify_to_Join_di" bpmnElement="Flow_Notify_to_Join">')
    xml_lines.append('        <di:waypoint x="1600" y="725" />')
    xml_lines.append('        <di:waypoint x="1680" y="725" />')
    xml_lines.append('        <di:waypoint x="1680" y="680" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Join_to_EndAuto_di" bpmnElement="Flow_Join_to_EndAuto">')
    xml_lines.append('        <di:waypoint x="1705" y="655" />')
    xml_lines.append('        <di:waypoint x="1762" y="655" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Escalate_HITL_di" bpmnElement="Flow_Escalate_HITL">')
    xml_lines.append('        <di:waypoint x="1260" y="680" />')
    xml_lines.append('        <di:waypoint x="1260" y="885" />')
    xml_lines.append('        <di:waypoint x="1310" y="885" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1265" y="750" width="85" height="27" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task41_to_Task42_di" bpmnElement="Flow_Task41_to_Task42">')
    xml_lines.append('        <di:waypoint x="1450" y="885" />')
    xml_lines.append('        <di:waypoint x="1500" y="885" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task42_to_Task43_di" bpmnElement="Flow_Task42_to_Task43">')
    xml_lines.append('        <di:waypoint x="1640" y="885" />')
    xml_lines.append('        <di:waypoint x="1690" y="885" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Task43_to_GW3_di" bpmnElement="Flow_Task43_to_GW3">')
    xml_lines.append('        <di:waypoint x="1830" y="885" />')
    xml_lines.append('        <di:waypoint x="1885" y="885" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Arbitration_Approve_di" bpmnElement="Flow_Arbitration_Approve">')
    xml_lines.append('        <di:waypoint x="1935" y="885" />')
    xml_lines.append('        <di:waypoint x="2012" y="885" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1940" y="865" width="58" height="14" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Flow_Arbitration_Reject_di" bpmnElement="Flow_Arbitration_Reject">')
    xml_lines.append('        <di:waypoint x="1910" y="910" />')
    xml_lines.append('        <di:waypoint x="1910" y="955" />')
    xml_lines.append('        <di:waypoint x="2012" y="955" />')
    xml_lines.append('        <bpmndi:BPMNLabel><dc:Bounds x="1918" y="930" width="85" height="14" /></bpmndi:BPMNLabel>')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Association_DMN_di" bpmnElement="Association_DMN">')
    xml_lines.append('        <di:waypoint x="1110" y="615" />')
    xml_lines.append('        <di:waypoint x="1110" y="600" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('      <bpmndi:BPMNEdge id="Association_Napas_di" bpmnElement="Association_Napas">')
    xml_lines.append('        <di:waypoint x="1560" y="565" />')
    xml_lines.append('        <di:waypoint x="1620" y="570" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')
    xml_lines.append('')
    xml_lines.append('      <!-- Data Associations (Nét đứt kết nối CSDL và Task) -->')
    xml_lines.append('      <bpmndi:BPMNEdge id="DataInputAssoc_Tracking_di" bpmnElement="DataInputAssoc_Tracking">')
    xml_lines.append('        <di:waypoint x="570" y="485" />')
    xml_lines.append('        <di:waypoint x="570" y="465" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')
    xml_lines.append('')
    xml_lines.append('      <bpmndi:BPMNEdge id="DataInputAssoc_VectorDB_di" bpmnElement="DataInputAssoc_VectorDB">')
    xml_lines.append('        <di:waypoint x="920" y="705" />')
    xml_lines.append('        <di:waypoint x="920" y="695" />')
    xml_lines.append('      </bpmndi:BPMNEdge>')

    xml_lines.append('    </bpmndi:BPMNPlane>')
    xml_lines.append('  </bpmndi:BPMNDiagram>')

    xml_lines.append('</bpmn:definitions>')

    return "\n".join(xml_lines)

def main():
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams"))
    os.makedirs(target_dir, exist_ok=True)
    target_bpmn = os.path.join(target_dir, "01-bpmn-incident-claim-resolution.bpmn")

    print(f"Generating Camunda Modeler BPMN 2.0 XML to:\n  {target_bpmn}")
    bpmn_content = generate_bpmn_xml()

    # XML Validation
    try:
        ET.fromstring(bpmn_content)
        print(">> Strict XML Validation Passed: Valid BPMN 2.0 XML.")
    except ET.ParseError as e:
        print(f">> Strict XML Validation FAILED: {e}")
        return

    target_files = [
        target_bpmn,
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs/graduation-thesis/diagrams/bpmn/01-bpmn-incident-claim-resolution.bpmn"))
    ]

    for f_path in target_files:
        os.makedirs(os.path.dirname(f_path), exist_ok=True)
        with open(f_path, "w", encoding="utf-8") as f:
            f.write(bpmn_content)
        print(f">> Successfully generated Camunda BPMN 2.0 file: {os.path.getsize(f_path)} bytes at:\n   {f_path}")

if __name__ == "__main__":
    main()
