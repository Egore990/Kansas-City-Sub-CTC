Imports System
Imports System.Collections.Generic
Imports System.Globalization
Imports System.Reflection
Imports System.Text.RegularExpressions
Imports System.Xml.Linq

' One process per case: static globals cannot leak between cases.
Public Module AutomationRunner
    Private transport As MemoryCmri
    Private ReadOnly constants As New Dictionary(Of String, Integer)(StringComparer.Ordinal)
    Private ReadOnly methods As New Dictionary(Of String, Action)(StringComparer.Ordinal) From {
        {"RouteCheckEast", AddressOf CTCLogic.RouteCheckEast},
        {"RouteCheckWest", AddressOf CTCLogic.RouteCheckWest},
        {"CTCSwitch", AddressOf CTCLogic.CTCSwitch},
        {"DoControls", AddressOf CTCLogic.DoControls},
        {"TimeLocking", AddressOf CTCLogic.TimeLocking},
        {"SwitchLock", AddressOf CTCLogic.SwitchLock},
        {"Indications", AddressOf CTCLogic.Indications},
        {"OfficeIndications", AddressOf CTCLogic.OfficeIndications},
        {"UpdateTrainIDs", AddressOf CTCLogic.UpdateTrainIDs},
        {"CheckTrainClear", AddressOf CTCLogic.CheckTrainClear},
        {"SetTrafficSticks", AddressOf CTCLogic.SetTrafficSticks},
        {"ClearTrafficSticks", AddressOf CTCLogic.ClearTrafficSticks},
        {"ReadRailroad", AddressOf CTCLogic.ReadRailroad},
        {"WriteRailroad", AddressOf CTCLogic.WriteRailroad},
        {"WriteNode0", AddressOf CTCLogic.WriteNode0},
        {"WriteNode1", AddressOf CTCLogic.WriteNode1},
        {"WriteNode2", AddressOf CTCLogic.WriteNode2},
        {"WriteNode3", AddressOf CTCLogic.WriteNode3},
        {"DoOneControlCycle", AddressOf CTCLogic.DoOneControlCycle}
    }

    Public Function Main(ByVal args() As String) As Integer
        Dim report As New XElement("result")
        Try
            If args.Length <> 2 Then Throw New ArgumentException("Usage: runner.exe catalog.xml case-id")
            Dim catalog As XDocument = XDocument.Load(args(0))
            For Each item As XElement In catalog.Root.Element("constants").Elements("constant")
                constants.Add(CStr(item.Attribute("name")), Integer.Parse(CStr(item.Attribute("value")), CultureInfo.InvariantCulture))
            Next
            Dim selected As XElement = Nothing
            For Each candidate As XElement In catalog.Root.Element("cases").Elements("case")
                If CStr(candidate.Attribute("id")) = args(1) Then
                    If selected IsNot Nothing Then Throw New ArgumentException("Duplicate case ID.")
                    selected = candidate
                End If
            Next
            If selected Is Nothing Then Throw New ArgumentException("Case not found.")
            report.SetAttributeValue("case", args(1))
            report.SetAttributeValue("category", CStr(selected.Attribute("category")))
            report.SetAttributeValue("classification", CStr(selected.Attribute("classification")))
            transport = New MemoryCmri()
            Dim backend As InterfaceCMRI = transport
            CTCLogic.InitializeRailroad(backend)
            Dim failures As Integer = 0
            For Each instruction As XElement In selected.Elements()
                Select Case instruction.Name.LocalName
                    Case "set"
                        WriteState(CStr(instruction.Attribute("name")), Resolve(CStr(instruction.Attribute("value"))))
                    Case "input"
                        Dim address As Integer = Integer.Parse(CStr(instruction.Attribute("node")), CultureInfo.InvariantCulture)
                        If address < 0 OrElse address > 3 Then Throw New ArgumentException("Invalid fake node.")
                        Dim bytes As New List(Of Integer)()
                        Dim raw As String = CStr(instruction.Attribute("bytes"))
                        If Not String.IsNullOrEmpty(raw) Then
                            For Each token As String In raw.Split(","c)
                                Dim value As Integer = Integer.Parse(token, CultureInfo.InvariantCulture)
                                If value < 0 OrElse value > 255 Then Throw New ArgumentException("Invalid fake byte.")
                                bytes.Add(value)
                            Next
                        End If
                        If bytes.Count > 3 Then Throw New ArgumentException("Too many input bytes.")
                        transport.InputBytes(address) = bytes.ToArray()
                        transport.InputErrors(address) = Integer.Parse(CStr(instruction.Attribute("error")), CultureInfo.InvariantCulture)
                    Case "call"
                        Dim name As String = CStr(instruction.Attribute("name"))
                        If name = "Reinitialize" Then
                            transport = New MemoryCmri()
                            backend = transport
                            CTCLogic.InitializeRailroad(backend)
                        Else
                            If Not methods.ContainsKey(name) Then Throw New ArgumentException("Method not allowlisted: " & name)
                            methods(name).Invoke()
                        End If
                    Case "expect"
                        Dim name As String = CStr(instruction.Attribute("name"))
                        Dim actual As Object = ReadState(name)
                        Dim expected As Object = Resolve(CStr(instruction.Attribute("value")))
                        If instruction.Attribute("mask") IsNot Nothing Then
                            Dim shift As Integer = Integer.Parse(CStr(instruction.Attribute("shift")), CultureInfo.InvariantCulture)
                            Dim mask As Integer = Integer.Parse(CStr(instruction.Attribute("mask")), CultureInfo.InvariantCulture)
                            actual = (Convert.ToInt32(actual, CultureInfo.InvariantCulture) >> shift) And mask
                        End If
                        Dim success As Boolean = EqualValue(actual, expected)
                        report.Add(New XElement("assertion", New XAttribute("name", name),
                                                New XAttribute("expected", Display(expected)),
                                                New XAttribute("actual", Display(actual)),
                                                New XAttribute("success", success)))
                        If Not success Then failures += 1
                    Case Else
                        Throw New ArgumentException("Unknown instruction: " & instruction.Name.LocalName)
                End Select
            Next
            If failures > 0 Then
                report.SetAttributeValue("status", "fail")
            ElseIf CStr(selected.Attribute("classification")) = "known-issue" Then
                report.SetAttributeValue("status", "observed-known-issue")
            Else
                report.SetAttributeValue("status", "pass")
            End If
            Console.WriteLine(report.ToString(SaveOptions.DisableFormatting))
            Return If(failures = 0, 0, 1)
        Catch ex As Exception
            report.SetAttributeValue("status", "error")
            report.Add(New XElement("error", ex.GetType().FullName & ": " & ex.Message))
            Console.WriteLine(report.ToString(SaveOptions.DisableFormatting))
            Return 2
        End Try
    End Function

    Private Function Resolve(ByVal raw As String) As Object
        If raw.StartsWith("@", StringComparison.Ordinal) Then Return constants(raw.Substring(1))
        If raw.StartsWith("text:", StringComparison.Ordinal) Then Return raw.Substring(5)
        If raw = "true" Then Return True
        If raw = "false" Then Return False
        Dim number As Integer
        If Integer.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, number) Then Return number
        Throw New ArgumentException("Use text: for string values.")
    End Function

    Private Function ReadState(ByVal name As String) As Object
        If name = "SignalTest.Visible" Then Return SignalTest.Visible
        If name = "MainPanel.UpdateCount" Then Return MainPanel.UpdateCount
        If name = "Fake.InitCount" Then Return transport.InitCount
        If name = "Fake.PortInitCount" Then Return transport.PortInitCount
        Dim match As Match = Regex.Match(name, "^Output\[(\d+),(\d+)\]$")
        If match.Success Then Return transport.LastOutput(Integer.Parse(match.Groups(1).Value))(Integer.Parse(match.Groups(2).Value))
        match = Regex.Match(name, "^WriteCount\[(\d+)\]$")
        If match.Success Then Return transport.WriteCounts(Integer.Parse(match.Groups(1).Value))
        Dim index As Integer
        Dim field As FieldInfo = StateField(name, index)
        Dim value As Object = field.GetValue(Nothing)
        If index >= 0 Then Return DirectCast(value, Array).GetValue(index)
        Return value
    End Function

    Private Sub WriteState(ByVal name As String, ByVal value As Object)
        If name = "SignalTest.Visible" Then
            SignalTest.Visible = Convert.ToBoolean(value, CultureInfo.InvariantCulture)
            Return
        End If
        Dim index As Integer
        Dim field As FieldInfo = StateField(name, index)
        If index >= 0 Then
            DirectCast(field.GetValue(Nothing), Array).SetValue(ConvertValue(value, field.FieldType.GetElementType()), index)
        Else
            If field.FieldType.IsArray Then Throw New ArgumentException("Use an array index.")
            field.SetValue(Nothing, ConvertValue(value, field.FieldType))
        End If
    End Sub

    Private Function StateField(ByVal name As String, ByRef index As Integer) As FieldInfo
        Dim match As Match = Regex.Match(name, "^([A-Za-z][A-Za-z0-9_]*)(?:\[(\d+)\])?$")
        If Not match.Success Then Throw New ArgumentException("Invalid public state path: " & name)
        Dim field As FieldInfo = GetType(CTCLogic).GetField(match.Groups(1).Value, BindingFlags.Public Or BindingFlags.Static)
        If field Is Nothing Then Throw New ArgumentException("Unknown public state: " & name)
        index = If(match.Groups(2).Success, Integer.Parse(match.Groups(2).Value), -1)
        Return field
    End Function

    Private Function ConvertValue(ByVal value As Object, ByVal target As Type) As Object
        If target Is GetType(Object) Then Return value
        Return Convert.ChangeType(value, target, CultureInfo.InvariantCulture)
    End Function

    Private Function EqualValue(ByVal actual As Object, ByVal expected As Object) As Boolean
        If actual Is Nothing OrElse expected Is Nothing Then Return actual Is expected
        If TypeOf expected Is String Then Return String.Equals(CStr(actual), CStr(expected), StringComparison.Ordinal)
        If TypeOf expected Is Boolean Then Return Convert.ToBoolean(actual, CultureInfo.InvariantCulture) = CBool(expected)
        Return Convert.ToInt32(actual, CultureInfo.InvariantCulture) = CInt(expected)
    End Function

    Private Function Display(ByVal value As Object) As String
        If value Is Nothing Then Return "<Nothing>"
        Return Convert.ToString(value, CultureInfo.InvariantCulture)
    End Function
End Module
