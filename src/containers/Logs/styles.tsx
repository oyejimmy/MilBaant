import styled from 'styled-components'
import { Input } from 'antd'

export const SearchInput = styled(Input)`
  height: 32px  ;
  border-radius: 8px  ;
  background: transparent  ;
  border: 1px solid var(--border-default)  ;
  box-shadow: none  ;

  .ant-input {
    background: transparent  ;
    font-size: 13px  ;
  }

  &:hover {
    border-color: var(--text-secondary)  ;
  }

  &:focus-within {
    border-color: var(--primary)  ;
    box-shadow: none  ;
  }
`

export const ActionCell = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`
